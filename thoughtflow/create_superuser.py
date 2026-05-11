import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thoughtflow.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ.get('NEW_SUPERUSER_USERNAME', 'admin')
email = os.environ.get('NEW_SUPERUSER_EMAIL', 'admin@example.com')
password = os.environ.get('NEW_SUPERUSER_PASSWORD', 'ChangeMe123!')

if User.objects.filter(username=username).exists():
    print(f"Superuser '{username}' already exists.")
else:
    User.objects.create_superuser(username, email, password)
    print(f"Created superuser '{username}' with the provided password.")
