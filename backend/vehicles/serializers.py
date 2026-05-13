"""
Serializers for Vehicles app.
"""
from rest_framework import serializers
from .models import Vehicle
from drivers.models import Driver
from drivers.serializers import DriverDetailSerializer

class VehicleSerializer(serializers.ModelSerializer):
    """Serializer base para vehículos."""
    
    primary_driver_detail = DriverDetailSerializer(source='primary_driver', read_only=True)
    compliance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    soat_days_until_expiration = serializers.IntegerField(read_only=True)
    rtm_days_until_expiration = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'license_plate', 'internal_number', 'brand', 'line', 'model',
            'vehicle_type', 'vin', 'engine_number', 'capacity', 'owner', 'status',
            'current_km', 'soat_expiration_date', 'rtm_expiration_date',
            'primary_driver', 'primary_driver_detail', 'authorized_drivers',
            'last_maintenance_date', 'next_maintenance_date', 'registration_date',
            'compliance_percentage', 'soat_days_until_expiration', 'rtm_days_until_expiration',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class VehicleDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para vehículos."""
    
    primary_driver_detail = DriverDetailSerializer(source='primary_driver', read_only=True)
    authorized_drivers_detail = DriverDetailSerializer(source='authorized_drivers', many=True, read_only=True)
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'license_plate', 'internal_number', 'brand', 'line', 'model',
            'vehicle_type', 'vin', 'engine_number', 'capacity', 'owner', 'status',
            'current_km', 'soat_expiration_date', 'rtm_expiration_date',
            'is_soat_expired', 'is_rtm_expired', 'soat_days_until_expiration',
            'rtm_days_until_expiration', 'primary_driver', 'primary_driver_detail',
            'authorized_drivers', 'authorized_drivers_detail', 'last_maintenance_date',
            'last_maintenance_km', 'next_maintenance_date', 'registration_date',
            'compliance_percentage', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VehicleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar vehículos."""
    
    class Meta:
        model = Vehicle
        fields = [
            'license_plate', 'internal_number', 'brand', 'line', 'model',
            'vehicle_type', 'vin', 'engine_number', 'capacity', 'owner', 'status',
            'current_km', 'soat_expiration_date', 'rtm_expiration_date',
            'primary_driver', 'last_maintenance_date', 'last_maintenance_km',
            'next_maintenance_date', 'registration_date', 'notes'
        ]
    
    def validate_license_plate(self, value):
        if self.instance and self.instance.license_plate == value:
            return value
        if Vehicle.objects.filter(license_plate=value).exists():
            raise serializers.ValidationError("Ya existe un vehículo con esta placa.")
        return value
