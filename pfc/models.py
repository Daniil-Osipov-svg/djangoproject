import datetime
from django.conf import settings
from django.db import models


class Person(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ration_entries"
    )

    currentdate = models.DateField(default=datetime.date.today)

    weight = models.FloatField()
    age = models.IntegerField()
    activity = models.FloatField()
    length = models.FloatField()
    gender = models.CharField(max_length=50)
    ziel = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.user.username} — {self.currentdate}"