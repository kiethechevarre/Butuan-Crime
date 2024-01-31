# Generated by Django 4.2.3 on 2023-08-31 12:51

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Barangay',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=19, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Crime',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=23)),
                ('datetime', models.DateTimeField()),
                ('barangay', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crimes', to='api.barangay')),
            ],
        ),
    ]
