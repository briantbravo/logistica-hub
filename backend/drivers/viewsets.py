"""
ViewSets for Drivers app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Driver
from .serializers import (
    DriverSerializer,
    DriverDetailSerializer,
    DriverCreateUpdateSerializer
)
from core.permissions import IsAdminOrSupervisor, CanViewDriver

class DriverViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de conductores.
    
    list: Obtener listado de conductores
    create: Crear nuevo conductor (Admin/Supervisor)
    retrieve: Obtener detalles de un conductor
    update: Actualizar conductor (Admin/Supervisor)
    partial_update: Actualización parcial (Admin/Supervisor)
    destroy: Eliminar conductor (Admin)
    with_expired_licenses: Conductores con licencias vencidas
    violations_report: Reporte de infracciones
    """
    
    queryset = Driver.objects.prefetch_related(
        'vehicles_as_primary',
        'authorized_vehicles'
    )
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'license_category']
    search_fields = ['first_name', 'last_name', 'identification_number', 'license_number']
    ordering_fields = ['first_name', 'last_name', 'created_at', 'status']
    ordering = ['-created_at']
    
    permission_classes = [IsAuthenticated, CanViewDriver]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DriverDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DriverCreateUpdateSerializer
        return DriverSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsAdminOrSupervisor]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrSupervisor])
    def with_expired_licenses(self, request):
        """Conductores con licencias vencidas."""
        drivers = self.get_queryset().filter(is_license_expired=True)
        serializer = self.get_serializer(drivers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrSupervisor])
    def violations_report(self, request):
        """Reporte de infracciones por conductor."""
        drivers = self.get_queryset().filter(violations_count__gt=0).order_by('-violations_count')
        serializer = self.get_serializer(drivers, many=True)
        return Response({
            'total_drivers_with_violations': drivers.count(),
            'drivers': serializer.data
        })
