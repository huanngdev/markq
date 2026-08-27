CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `users` (`id`, `display_name`, `created_at`, `updated_at`)
VALUES ('legacy-user', 'Legacy user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attempt_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_order` integer NOT NULL,
	`question_snapshot` text NOT NULL,
	`options_snapshot` text NOT NULL,
	`selected_options` text DEFAULT '[]' NOT NULL,
	`correct_options` text NOT NULL,
	`selection_mode` text NOT NULL,
	`points` real NOT NULL,
	`earned_points` real DEFAULT 0 NOT NULL,
	`is_correct` integer,
	`is_flagged` integer DEFAULT false NOT NULL,
	`explanation_snapshot` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attempt_answers`("id", "attempt_id", "question_id", "question_order", "question_snapshot", "options_snapshot", "selected_options", "correct_options", "selection_mode", "points", "earned_points", "is_correct", "is_flagged", "explanation_snapshot", "updated_at")
SELECT "id", "attempt_id", "question_id", "question_order", "question_snapshot", "options_snapshot",
  CASE WHEN "selected_option" IS NULL THEN '[]' ELSE json_array("selected_option") END,
  json_array("correct_option"), 'single', 1,
  CASE WHEN "is_correct" = 1 THEN 1 ELSE 0 END,
  "is_correct", false, "explanation_snapshot",
  COALESCE((SELECT "submitted_at" FROM `attempts` WHERE `attempts`.`id` = `attempt_answers`.`attempt_id`), CURRENT_TIMESTAMP)
FROM `attempt_answers`;--> statement-breakpoint
DROP TABLE `attempt_answers`;--> statement-breakpoint
ALTER TABLE `__new_attempt_answers` RENAME TO `attempt_answers`;--> statement-breakpoint
CREATE INDEX `attempt_answers_attempt_order_idx` ON `attempt_answers` (`attempt_id`,`question_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_answers_attempt_question_idx` ON `attempt_answers` (`attempt_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `__new_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`quiz_id` text NOT NULL,
	`quiz_title` text NOT NULL,
	`quiz_schema_version` integer NOT NULL,
	`status` text NOT NULL,
	`settings_snapshot` text NOT NULL,
	`question_order_snapshot` text NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`incorrect_count` integer DEFAULT 0 NOT NULL,
	`unanswered_count` integer DEFAULT 0 NOT NULL,
	`total_questions` integer NOT NULL,
	`earned_points` real DEFAULT 0 NOT NULL,
	`total_points` real NOT NULL,
	`score_percent` integer DEFAULT 0 NOT NULL,
	`passed` integer,
	`started_at` text NOT NULL,
	`expires_at` text,
	`updated_at` text NOT NULL,
	`submitted_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attempts`("id", "user_id", "quiz_id", "quiz_title", "quiz_schema_version", "status", "settings_snapshot", "question_order_snapshot", "correct_count", "incorrect_count", "unanswered_count", "total_questions", "earned_points", "total_points", "score_percent", "passed", "started_at", "expires_at", "updated_at", "submitted_at", "version")
SELECT "id", 'legacy-user', "quiz_id", "quiz_title", 1, 'submitted',
  '{"timeLimitMinutes":null,"shuffleQuestions":false,"shuffleOptions":false,"navigationMode":"free","allowUnanswered":true,"reviewMode":"after-submit","passingScore":null,"expireBehavior":"auto-submit","scoringMode":"exact","incorrectPenalty":0,"attemptsAllowed":null}',
  '[]', "correct_count", "incorrect_count", "unanswered_count", "total_questions",
  "correct_count", "total_questions", "score_percent", NULL,
  "submitted_at", NULL, "submitted_at", "submitted_at", 1
FROM `attempts`;--> statement-breakpoint
DROP TABLE `attempts`;--> statement-breakpoint
ALTER TABLE `__new_attempts` RENAME TO `attempts`;--> statement-breakpoint
CREATE INDEX `attempts_user_updated_idx` ON `attempts` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `attempts_user_quiz_status_idx` ON `attempts` (`user_id`,`quiz_id`,`status`);--> statement-breakpoint
CREATE INDEX `attempts_quiz_submitted_idx` ON `attempts` (`quiz_id`,`submitted_at`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
