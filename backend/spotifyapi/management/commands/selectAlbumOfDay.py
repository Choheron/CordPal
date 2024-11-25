from django.core.management.base import BaseCommand, CommandError
from spotifyapi.models import DailyAlbum, Album

from datetime import date as do, timedelta
import random

class Command(BaseCommand):
  help = "Selects an album of the day for the current date. Album of the day should be run at 12:01 CT."
  
  def handle(self, *args, **options):
    # Get current date
    day = do.today()
    # Check if a current album of the day already exists
    try:
      currDayAlbum = DailyAlbum.objects.get(date=day)
      self.stdout.write(
        self.style.ERROR(f'ERROR: Album already exists for today! {currDayAlbum}')
      )
      return
    except DailyAlbum.DoesNotExist:
      print("Today does not yet have an album, selecting one...")
    # Get Date a year ago to filter by
    one_year_ago = day - timedelta(days=365)
    # Define a boolean for selecting the right album
    selected = False
    # Define Album Object
    albumOfTheDay = None
    while(not selected):
      tempAlbum = random.choice(Album.objects.all())
      try:
        albumCheck = DailyAlbum.objects.filter(date__gte=one_year_ago).get(album=tempAlbum)
      except DailyAlbum.DoesNotExist:
        albumOfTheDay = tempAlbum
        selected = True
    # Create an album of the day object
    albumOfTheDayObj = DailyAlbum(
      album=albumOfTheDay,
      date=day
    )
    # Save object
    albumOfTheDayObj.save()
    # Print success
    self.stdout.write(
      self.style.SUCCESS(f'Successfully selected album of the day: {albumOfTheDayObj}')
    )