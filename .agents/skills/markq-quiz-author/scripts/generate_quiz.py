#!/usr/bin/env python3
"""Generate a MarkQ Markdown quiz from validated JSON input."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


KEBAB_CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
OPTION_ID = re.compile(r"^[A-Za-z0-9]+$")


def require_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value.strip()


def yaml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def validate(data: Any) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise ValueError("input root must be a JSON object")

    quiz_id = require_text(data.get("id"), "id")
    if not KEBAB_CASE.fullmatch(quiz_id):
        raise ValueError("id must use kebab-case")

    title = require_text(data.get("title"), "title")
    description = data.get("description", "")
    if not isinstance(description, str):
        raise ValueError("description must be a string")

    tags = data.get("tags", [])
    if not isinstance(tags, list) or any(not isinstance(tag, str) or not tag.strip() for tag in tags):
        raise ValueError("tags must be a list of non-empty strings")

    published = data.get("published", True)
    if not isinstance(published, bool):
        raise ValueError("published must be a boolean")

    questions = data.get("questions")
    if not isinstance(questions, list) or not questions:
        raise ValueError("questions must be a non-empty list")

    seen_questions: set[str] = set()
    normalized_questions: list[dict[str, Any]] = []
    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise ValueError(f"questions[{index}] must be an object")

        question_id = require_text(question.get("id"), f"questions[{index}].id")
        if not KEBAB_CASE.fullmatch(question_id):
            raise ValueError(f"questions[{index}].id must use kebab-case")
        if question_id in seen_questions:
            raise ValueError(f"duplicate question id: {question_id}")
        seen_questions.add(question_id)

        prompt = require_text(question.get("prompt"), f"questions[{index}].prompt")
        explanation = require_text(question.get("explanation"), f"questions[{index}].explanation")
        options = question.get("options")
        if not isinstance(options, list) or len(options) < 2:
            raise ValueError(f"questions[{index}].options must contain at least two items")

        seen_options: set[str] = set()
        normalized_options: list[dict[str, str]] = []
        for option_index, option in enumerate(options, start=1):
            if not isinstance(option, dict):
                raise ValueError(f"questions[{index}].options[{option_index}] must be an object")
            option_id = require_text(option.get("id"), f"questions[{index}].options[{option_index}].id").upper()
            content = require_text(option.get("content"), f"questions[{index}].options[{option_index}].content")
            if not OPTION_ID.fullmatch(option_id):
                raise ValueError(f"invalid option id: {option_id}")
            if option_id in seen_options:
                raise ValueError(f"duplicate option id in {question_id}: {option_id}")
            if "\n" in content or "\r" in content:
                raise ValueError(f"option {option_id} in {question_id} must stay on one line")
            seen_options.add(option_id)
            normalized_options.append({"id": option_id, "content": content})

        answer = require_text(question.get("answer"), f"questions[{index}].answer").upper()
        if answer not in seen_options:
            raise ValueError(f"answer {answer} does not exist in question {question_id}")

        normalized_questions.append(
            {
                "id": question_id,
                "prompt": prompt,
                "options": normalized_options,
                "answer": answer,
                "explanation": explanation,
            }
        )

    return {
        "id": quiz_id,
        "title": title,
        "description": description.strip(),
        "tags": [tag.strip() for tag in tags],
        "published": published,
        "questions": normalized_questions,
    }


def render(data: dict[str, Any]) -> str:
    lines = [
        "---",
        f"id: {data['id']}",
        f"title: {yaml_string(data['title'])}",
        f"description: {yaml_string(data['description'])}",
    ]
    if data["tags"]:
        lines.append("tags:")
        lines.extend(f"  - {yaml_string(tag)}" for tag in data["tags"])
    else:
        lines.append("tags: []")
    lines.extend(
        [
            f"published: {'true' if data['published'] else 'false'}",
            "---",
            "",
            f"# {data['title']}",
        ]
    )

    for question in data["questions"]:
        lines.extend(
            [
                "",
                f"## {question['id']}",
                "",
                "### Question",
                "",
                question["prompt"],
                "",
                "### Options",
                "",
            ]
        )
        lines.extend(f"- [ ] {option['id']}. {option['content']}" for option in question["options"])
        lines.extend(
            [
                "",
                "### Answer",
                "",
                question["answer"],
                "",
                "### Explanation",
                "",
                question["explanation"],
            ]
        )

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="UTF-8 JSON quiz source")
    parser.add_argument("--output", type=Path, help="Output .md path")
    parser.add_argument("--force", action="store_true", help="Replace an existing output file")
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
