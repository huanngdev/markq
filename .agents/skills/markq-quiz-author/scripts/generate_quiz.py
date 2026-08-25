#!/usr/bin/env python3
"""Generate a MarkQ v2 Markdown quiz from validated JSON input."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

KEBAB_CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
OPTION_ID = re.compile(r"^[A-Za-z0-9]+$")
DEFAULT_SETTINGS: dict[str, Any] = {
    "timeLimitMinutes": None,
    "shuffleQuestions": False,
    "shuffleOptions": False,
    "navigationMode": "free",
    "allowUnanswered": True,
    "reviewMode": "after-submit",
    "passingScore": None,
    "expireBehavior": "auto-submit",
    "scoringMode": "exact",
    "incorrectPenalty": 0,
    "attemptsAllowed": None,
}


def require_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value.strip()


def require_number(value: Any, field: str, *, minimum: float | None = None) -> float | int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{field} must be a number")
    if minimum is not None and value < minimum:
        raise ValueError(f"{field} must be at least {minimum}")
    return value


def validate_settings(raw: Any) -> dict[str, Any]:
    if raw is None:
        return dict(DEFAULT_SETTINGS)
    if not isinstance(raw, dict):
        raise ValueError("settings must be an object")
    unknown = set(raw) - set(DEFAULT_SETTINGS)
    if unknown:
        raise ValueError(f"unknown settings: {', '.join(sorted(unknown))}")
    settings = {**DEFAULT_SETTINGS, **raw}
    for key in ("shuffleQuestions", "shuffleOptions", "allowUnanswered"):
        if not isinstance(settings[key], bool):
            raise ValueError(f"settings.{key} must be a boolean")
    for key, values in {
        "navigationMode": {"free", "sequential"},
        "reviewMode": {"after-submit", "never"},
        "expireBehavior": {"auto-submit", "mark-expired"},
        "scoringMode": {"exact", "partial"},
    }.items():
        if settings[key] not in values:
            raise ValueError(f"invalid settings.{key}")
    for key in ("timeLimitMinutes", "attemptsAllowed"):
        value = settings[key]
        if value is not None and (isinstance(value, bool) or not isinstance(value, int) or value <= 0):
            raise ValueError(f"settings.{key} must be a positive integer or null")
    passing_score = settings["passingScore"]
    if passing_score is not None and not 0 <= require_number(passing_score, "settings.passingScore") <= 100:
        raise ValueError("settings.passingScore must be between 0 and 100")
    require_number(settings["incorrectPenalty"], "settings.incorrectPenalty", minimum=0)
    return settings


def validate(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise ValueError("input root must be a JSON object")
    quiz_id = require_text(data.get("id"), "id")
    if not KEBAB_CASE.fullmatch(quiz_id):
        raise ValueError("id must use kebab-case")
    title = require_text(data.get("title"), "title")
    description = data.get("description", "")
    tags = data.get("tags", [])
    published = data.get("published", True)
    visibility = data.get("visibility", "public")
    if not isinstance(description, str):
        raise ValueError("description must be a string")
    if not isinstance(tags, list) or any(not isinstance(tag, str) or not tag.strip() for tag in tags):
        raise ValueError("tags must be a list of non-empty strings")
    if not isinstance(published, bool):
        raise ValueError("published must be a boolean")
    if visibility not in {"public", "unlisted", "private"}:
        raise ValueError("visibility must be public, unlisted, or private")
    questions = data.get("questions")
    if not isinstance(questions, list) or not questions:
        raise ValueError("questions must be a non-empty list")

    seen_questions: set[str] = set()
    normalized_questions: list[dict[str, Any]] = []
    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise ValueError(f"questions[{index}] must be an object")
        question_id = require_text(question.get("id"), f"questions[{index}].id")
        if not KEBAB_CASE.fullmatch(question_id) or question_id in seen_questions:
            raise ValueError(f"invalid or duplicate question id: {question_id}")
        seen_questions.add(question_id)
        options = question.get("options")
        if not isinstance(options, list) or len(options) < 2:
            raise ValueError(f"questions[{index}].options must contain at least two items")
        seen_options: set[str] = set()
        normalized_options: list[dict[str, str]] = []
        for option_index, option in enumerate(options, start=1):
            if not isinstance(option, dict):
                raise ValueError(f"questions[{index}].options[{option_index}] must be an object")
            option_id = require_text(option.get("id"), "option.id").upper()
            content = require_text(option.get("content"), "option.content")
            if not OPTION_ID.fullmatch(option_id) or option_id in seen_options:
                raise ValueError(f"invalid or duplicate option id in {question_id}: {option_id}")
            if "\n" in content or "\r" in content:
                raise ValueError(f"option {option_id} in {question_id} must stay on one line")
            seen_options.add(option_id)
            normalized_options.append({"id": option_id, "content": content})

        raw_answer = question.get("answer")
        answer_values = raw_answer if isinstance(raw_answer, list) else [raw_answer]
        answers = [require_text(value, f"questions[{index}].answer").upper() for value in answer_values]
        if not answers or len(set(answers)) != len(answers):
            raise ValueError(f"answers in {question_id} must be non-empty and unique")
        unknown = next((answer for answer in answers if answer not in seen_options), None)
        if unknown:
            raise ValueError(f"answer {unknown} does not exist in question {question_id}")
        points = require_number(question.get("points", 1), f"questions[{index}].points", minimum=0.000001)
        normalized_questions.append({
            "id": question_id,
            "prompt": require_text(question.get("prompt"), f"questions[{index}].prompt"),
            "options": normalized_options,
            "answers": answers,
            "points": points,
            "explanation": require_text(question.get("explanation"), f"questions[{index}].explanation"),
        })
    return {
        "id": quiz_id,
        "title": title,
        "description": description.strip(),
        "tags": [tag.strip() for tag in tags],
        "published": published,
        "visibility": visibility,
        "settings": validate_settings(data.get("settings")),
        "questions": normalized_questions,
    }


def yaml_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def render(data: dict[str, Any]) -> str:
    lines = [
        "---", "schemaVersion: 2", f"id: {data['id']}",
        f"title: {yaml_scalar(data['title'])}",
        f"description: {yaml_scalar(data['description'])}",
        "tags:", *[f"  - {yaml_scalar(tag)}" for tag in data["tags"]],
        f"published: {yaml_scalar(data['published'])}",
        f"visibility: {data['visibility']}", "settings:",
        *[f"  {key}: {yaml_scalar(value)}" for key, value in data["settings"].items()],
        "---", "", f"# {data['title']}",
    ]
    if not data["tags"]:
        lines[lines.index("tags:")] = "tags: []"
    for question in data["questions"]:
        lines.extend(["", f"## {question['id']}", "", "### Question", "", question["prompt"], "", "### Options", ""])
        lines.extend(f"- [ ] {option['id']}. {option['content']}" for option in question["options"])
        lines.extend(["", "### Answer", ""])
        if len(question["answers"]) == 1:
            lines.append(question["answers"][0])
        else:
            lines.extend(f"- {answer}" for answer in question["answers"])
        lines.extend(["", "### Points", "", str(question["points"]), "", "### Explanation", "", question["explanation"]])
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    with args.input.open("r", encoding="utf-8") as source:
        data = validate(json.load(source))
    output = args.output or Path("content/quizzes") / f"{data['id']}.md"
    if output.suffix.lower() != ".md":
        raise ValueError("output path must end in .md")
    if output.exists() and not args.force:
        raise FileExistsError(f"refusing to overwrite {output}; pass --force if intended")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render(data), encoding="utf-8")
    print(f"Created {output} ({len(data['questions'])} questions)")


if __name__ == "__main__":
    main()
