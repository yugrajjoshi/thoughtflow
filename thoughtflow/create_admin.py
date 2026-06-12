import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'thoughtflow.settings')
django.setup()

from django.contrib.auth import get_user_model

def create_admin():
    User = get_user_model()
    username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'yuvi')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'yugrajjoshi37@gmail.com')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD', '4660533')

    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser '{username}' created successfully.")
    else:
        print(f"Superuser '{username}' already exists.")

if __name__ == '__main__':
    create_admin()
