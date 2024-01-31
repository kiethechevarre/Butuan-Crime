from django.db import models

class Barangay(models.Model):
    name = models.CharField(max_length=19, unique=True)

    def __str__(self):
        return f"{self.id}; {self.name}"

class Crime(models.Model):
    name = models.CharField(max_length=23)
    datetime = models.DateTimeField()
    barangay = models.ForeignKey(Barangay, on_delete=models.CASCADE, related_name="crimes")

    def __str__(self):
        return f"{self.name}; {self.datetime}; {self.barangay}"
