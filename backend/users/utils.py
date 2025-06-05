from django.http import HttpRequest
from django.core.exceptions import ObjectDoesNotExist

from backend.utils import (
  postToDiscordWebhook
)

from .models import User
import logging

# Declare logging
logger = logging.getLogger('django')


def createUserFromDiscordJSON(discordDataJson):
  '''Create a new user from discord Json data'''
  logger.info(f"Creating a new user for discord user id {discordDataJson['id']} with a username of {discordDataJson['username']}...")
  # Create user instance
  user = User(
    username = discordDataJson['username'], 
    email = discordDataJson['email'],
    nickname = discordDataJson['global_name'] if (discordDataJson['global_name'] != None) else  discordDataJson['username'], # Strange issue when certian users were joining, bandaid fix
    discord_id = discordDataJson['id'],
    discord_discriminator = discordDataJson['discriminator'],
    discord_is_verified = discordDataJson['verified'],
    discord_avatar = discordDataJson['avatar'],
  )
  # Save User
  user.save()
  # Report that a user has been created
  postToDiscordWebhook(discordDataJson, f"User created for username: **{discordDataJson['username']}**!")
  return True


def doesUserExist(id):
  '''Check if a user exists'''
  logger.info(f"Checking if user with id {id} exists...")
  # Return check if user exists
  try:
    User.objects.get(discord_id=id)
    return True
  except ObjectDoesNotExist:
    return False
  

def getSpotifyUser(discord_id):
  '''Return User Object corresponding to discord id'''
  try:
    return User.objects.filter(discord_id=discord_id).first()
  except ObjectDoesNotExist:
    return None
  

def getUserObj(discord_id):
  """Return User Object corresponding to discord id"""
  try:
    return User.objects.filter(discord_id=discord_id).first()
  except ObjectDoesNotExist:
    return None