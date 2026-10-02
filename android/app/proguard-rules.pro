# WorkManager instantiates workers reflectively by class name.
-keep class space.gitwall.app.RefreshWorker { *; }
-keep class space.gitwall.app.AlarmReceiver { *; }
-keep class space.gitwall.app.BootReceiver { *; }
