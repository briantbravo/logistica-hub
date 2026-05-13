"""
Maintenance models for Logística-Hub.
"""
from django.db import models
from django.utils import timezone

class MaintenanceType(models.Model):
    """
    Tipos de mantenimiento disponibles.
    """
    TYPE_CHOICES = [
        ('preventivo', 'Preventivo'),
        ('correctivo', 'Correctivo'),
        ('predictivo', 'Predictivo'),
        ('legal', 'Legal (RTM)'),
    ]
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nombre del tipo de mantenimiento"
    )
    
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Categoría"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción detallada"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'maintenance_maintenance_type'
        ordering = ['type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class MaintenanceSchedule(models.Model):
    """
    Programación de mantenimientos preventivos.
    """
    FREQUENCY_UNIT_CHOICES = [
        ('days', 'Días'),
        ('km', 'Kilómetros'),
        ('months', 'Meses'),
    ]
    
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.CASCADE,
        related_name='maintenance_schedules',
        help_text="Vehículo"
    )
    
    maintenance_type = models.ForeignKey(
        MaintenanceType,
        on_delete=models.PROTECT,
        help_text="Tipo de mantenimiento"
    )
    
    frequency = models.IntegerField(
        help_text="Número de unidades"
    )
    
    frequency_unit = models.CharField(
        max_length=10,
        choices=FREQUENCY_UNIT_CHOICES,
        help_text="Unidad de frecuencia"
    )
    
    last_maintenance_date = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha del último mantenimiento"
    )
    
    last_maintenance_km = models.IntegerField(
        null=True,
        blank=True,
        help_text="Kilometraje del último mantenimiento"
    )
    
    next_maintenance_date = models.DateField(
        null=True,
        blank=True,
        help_text="Próxima fecha programada"
    )
    
    next_maintenance_km = models.IntegerField(
        null=True,
        blank=True,
        help_text="Próximo kilómetro programado"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Programación activa"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'maintenance_maintenance_schedule'
        ordering = ['-created_at']
        unique_together = ['vehicle', 'maintenance_type']
    
    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.maintenance_type.name}"


class MaintenanceRecord(models.Model):
    """
    Registro de mantenimientos ejecutados.
    """
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]
    
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.CASCADE,
        related_name='maintenance_records',
        help_text="Vehículo"
    )
    
    schedule = models.ForeignKey(
        MaintenanceSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='records',
        help_text="Programación"
    )
    
    maintenance_type = models.ForeignKey(
        MaintenanceType,
        on_delete=models.PROTECT,
        help_text="Tipo de mantenimiento"
    )
    
    workshop = models.ForeignKey(
        'workshops.Workshop',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Taller ejecutor"
    )
    
    date = models.DateField(
        help_text="Fecha de ejecución"
    )
    
    km = models.IntegerField(
        help_text="Kilometraje en el momento del mantenimiento"
    )
    
    description = models.TextField(
        help_text="Descripción de trabajos realizados"
    )
    
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Costo total"
    )
    
    parts_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Costo de piezas"
    )
    
    labor_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Costo de mano de obra"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completado',
        help_text="Estado del mantenimiento"
    )
    
    responsible = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Usuario responsable"
    )
    
    invoice = models.FileField(
        upload_to='maintenance/invoices/',
        null=True,
        blank=True,
        help_text="Factura del mantenimiento"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notas adicionales"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'maintenance_maintenance_record'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['vehicle', '-date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.maintenance_type.name} ({self.date})"
