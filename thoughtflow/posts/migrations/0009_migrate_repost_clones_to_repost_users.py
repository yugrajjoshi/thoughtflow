from django.db import migrations


def migrate_repost_clones(apps, schema_editor):
    Post = apps.get_model('posts', 'Post')

    clone_ids_to_delete = []

    for clone_post in Post.objects.filter(reposts__isnull=False).distinct().prefetch_related('reposts'):
        original_posts = list(clone_post.reposts.all())
        if not original_posts:
            continue

        for original_post in original_posts:
            original_post.repost_users.add(clone_post.user)

        clone_ids_to_delete.append(clone_post.id)

    if clone_ids_to_delete:
        Post.objects.filter(id__in=clone_ids_to_delete).delete()

    for post in Post.objects.all():
        post.reposts_count = post.repost_users.count()
        post.save(update_fields=['reposts_count'])


def noop_reverse(apps, schema_editor):
    # Irreversible by design: clone repost posts are removed after migration.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0008_post_repost_users'),
    ]

    operations = [
        migrations.RunPython(migrate_repost_clones, noop_reverse),
    ]
