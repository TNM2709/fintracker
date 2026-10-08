-- Rollback 000003_add_users_and_notifications
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_notification_settings;
DROP TABLE IF EXISTS users;
