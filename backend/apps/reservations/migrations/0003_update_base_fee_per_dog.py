from decimal import Decimal

from django.db import migrations, models


def update_facility_rule_base_fee(apps, schema_editor):
    FacilityRule = apps.get_model("reservations", "FacilityRule")
    FacilityRule.objects.all().update(base_fee_per_dog=Decimal("200.00"))


class Migration(migrations.Migration):

    dependencies = [
        ("reservations", "0002_facilityrule_auto_checkout_grace_minutes_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="facilityrule",
            name="base_fee_per_dog",
            field=models.DecimalField(decimal_places=2, default=Decimal("200.00"), max_digits=8),
        ),
        migrations.RunPython(update_facility_rule_base_fee, migrations.RunPython.noop),
    ]
