from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0007_comment_image_comment_video'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='repost_users',
            field=models.ManyToManyField(blank=True, related_name='reposted_posts', to='auth.user'),
        ),
    ]
