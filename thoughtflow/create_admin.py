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

    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    user.email = email
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.save()

    if created:
        print(f"Superuser '{username}' created successfully.")
    else:
        print(f"Existing user '{username}' updated/promoted to superuser.")

if __name__ == '__main__':
    create_admin()
