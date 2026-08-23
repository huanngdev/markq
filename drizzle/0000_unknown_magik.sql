CREATE TABLE `attempt_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_order` integer NOT NULL,
	`question_snapshot` text NOT NULL,
	`options_snapshot` text NOT NULL,
	`selected_option` text,
	`correct_option` text NOT NULL,
	`is_correct` integer NOT NULL,
	`explanation_snapshot` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempt_answers_attempt_order_idx` ON `attempt_answers` (`attempt_id`,`question_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `attempt_answers_attempt_question_idx` ON `attempt_answers` (`attempt_id`,`question_id`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`quiz_id` text NOT NULL,
	`quiz_title` text NOT NULL,
	`correct_count` integer NOT NULL,
	`incorrect_count` integer NOT NULL,
	`unanswered_count` integer NOT NULL,
	`total_questions` integer NOT NULL,
	`score_percent` integer NOT NULL,
	`submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attempts_quiz_submitted_idx` ON `attempts` (`quiz_id`,`submitted_at`);