from django.contrib.contenttypes.models import ContentType

import logging

from users.models import User
from .models import Reaction

# Declare logging
logger = logging.getLogger('django')


def createReaction(target_obj, user: User, emoji):
  """Create a reaction attached to the passed in object"""
  logger.debug("Attempting to create a reaction...")
  reaction: Reaction = target_obj.reactions.create(
    user=user,
    emoji=emoji,
  )