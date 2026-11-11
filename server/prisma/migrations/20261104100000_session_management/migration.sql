CREATE INDEX "user_sessions_user_expire_idx"
ON "user_sessions" (("sess" ->> 'userId'), "expire");
