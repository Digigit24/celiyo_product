# ============================================================
# UPDATED BACKEND APPOINTMENT TYPE MODEL
# Apply this to your Django backend: apps/appointments/models.py
# ============================================================

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal


class AppointmentType(models.Model):
    """Types of medical appointments"""
    tenant_id = models.UUIDField(db_index=True, help_text="Tenant this record belongs to")
    name = models.CharField(max_length=100)
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique code for this appointment type (e.g., 'consultation', 'follow_up')"
    )
    description = models.TextField(blank=True, null=True)
    duration_default = models.PositiveIntegerField(default=15)  # Default duration in minutes
    base_consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this appointment type is currently active"
    )
    color = models.CharField(
        max_length=7,
        default='#3b82f6',
        help_text="Hex color code for UI display (e.g., '#3b82f6')"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointment_types'
        verbose_name = 'Appointment Type'
        verbose_name_plural = 'Appointment Types'
        indexes = [
            models.Index(fields=['tenant_id']),
            models.Index(fields=['tenant_id', 'name']),
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
        unique_together = [('tenant_id', 'code')]

    def __str__(self):
        return f"{self.name} ({self.code})"


# ============================================================
# MIGRATION COMMANDS
# ============================================================
# After updating the model, run:
# python manage.py makemigrations appointments
# python manage.py migrate appointments
