import csv
import random

high_quality_texts = [
    "This is a comprehensive analysis of the topic that provides multiple perspectives and detailed explanations. The author demonstrates deep understanding through well-structured arguments, relevant examples, and clear reasoning. Each point is thoroughly explained with supporting evidence, making it easy for readers to follow the logic and draw their own conclusions.",
    "A highly detailed and structured explanation with strong reasoning and examples. The content covers all important aspects of the subject matter, providing both theoretical background and practical applications. The writing is clear, well-organized, and demonstrates expertise in the field.",
    "This post provides excellent clarity, depth, and well-supported arguments. The author presents a balanced view, considers multiple angles, and backs up claims with credible sources. The structure is logical, making complex topics accessible to readers.",
    "A very informative and well-organized answer with technical insights. The explanation is thorough, covering both basic concepts and advanced details. Examples are relevant and help illustrate key points effectively.",
    "A deeply researched explanation demonstrating strong understanding. The content shows careful consideration of the topic, with well-thought-out arguments and comprehensive coverage of important aspects.",
    "This detailed post offers valuable insights through careful analysis and clear presentation. The author provides context, explains concepts thoroughly, and uses appropriate examples to support the main points.",
    "An excellent piece that combines theoretical knowledge with practical wisdom. The writing is engaging, well-structured, and provides readers with actionable information they can apply.",
]

medium_quality_texts = [
    "A decent explanation but lacks deeper detail. The main points are covered but could benefit from more examples or additional context to fully understand the concepts.",
    "The content is okay but missing some important insights. It covers the basics adequately but doesn't dive deep into the more nuanced aspects of the topic.",
    "Readable and somewhat helpful answer with average depth. The explanation is clear enough but could be more comprehensive to truly help readers understand the subject.",
    "This explanation covers basics but not very thorough. While it addresses the main question, it lacks the depth and detail needed for a complete understanding.",
    "A moderately useful post with some missing elements. The content is readable and has some value, but it would benefit from more structure and detail.",
    "The post provides a basic overview of the topic. It's understandable but lacks the depth and examples that would make it truly helpful.",
]

low_quality_texts = [
    "Very short and unclear explanation.",
    "Weak and incomplete answer with no detail.",
    "Low effort post with vague statements.",
    "Not helpful, lacks clarity.",
    "Poorly written content missing structure.",
    "This doesn't make much sense.",
    "I don't know what to say about this.",
    "Maybe this is relevant? Not sure.",
]

spam_texts = [
    "Buy now free offer click here spam spam spam.",
    "Promotional content with no informational value.",
    "Random repeated words spam spam spam.",
    "Fake marketing message click link now.",
    "Meaningless text asd qwe zxc.",
    "asdfghjkl qwertyuiop zxcvbnm",
    "aaaaa bbbbb ccccc ddddd",
    "click here now buy free offer",
    "spam spam spam spam spam spam",
    "qwerty asdfgh zxcvbn qwerty",
    "random words that don't make sense together",
    "repeated repeated repeated repeated",
]

rows = []

for _ in range(150):  # High quality
    text = random.choice(high_quality_texts)
    up = random.randint(4, 10)
    down = random.randint(0, 2)
    rows.append([text, up, down, 1])

for _ in range(150):  # Medium quality
    text = random.choice(medium_quality_texts)
    up = random.randint(1, 5)
    down = random.randint(0, 3)
    label = 1 if up > down else 0
    rows.append([text, up, down, label])

for _ in range(100):  # Low quality
    text = random.choice(low_quality_texts)
    up = random.randint(0, 2)
    down = random.randint(1, 5)
    rows.append([text, up, down, 0])

for _ in range(100):  # Spam
    text = random.choice(spam_texts)
    up = random.randint(0, 1)
    down = random.randint(4, 8)
    rows.append([text, up, down, 0])

with open("dataset.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["post_body", "upvotes", "downvotes", "score_label"])
    writer.writerows(rows)

print("Generated dataset.csv with", len(rows), "rows.")
