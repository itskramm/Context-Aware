import { base44 } from "@/api/base44Client";
import { formatDuration, compactDuration } from "@/lib/lectureUtils";

// Creates realistic demo lectures (with transcripts, topics, visual content)
// and a sample digest for the current user, so the prototype can be
// demonstrated immediately. All records are owned by the current user and
// respect the app's row-level security.

const SAMPLE_LECTURES = [
  {
    title: "Database Normalization",
    course: "Database Management Systems",
    description: "An introduction to database normalization, covering 1NF, 2NF, 3NF, BCNF, and functional dependencies. We work through examples of decomposing tables to reduce redundancy and anomalies.",
    duration: 5535,
    duration_label: "01:32:15",
    lecture_date: "2026-09-15",
    tags: ["databases", "normalization", "1NF", "2NF", "3NF"],
    thumbnail_url: "https://images.unsplash.com/photo-1544383819-3-3f27b9e0eaa?w=800&q=80",
    topics: [
      { name: "Introduction to Normalization", start: 120, end: 360 },
      { name: "First Normal Form", start: 360, end: 600 },
      { name: "Second Normal Form", start: 600, end: 900 },
      { name: "Third Normal Form", start: 900, end: 1200 },
      { name: "Functional Dependencies", start: 1200, end: 1500 },
      { name: "BCNF", start: 2700, end: 3000 },
      { name: "Denormalization", start: 3300, end: 3600 },
    ],
    transcripts: [
      { t: 135, text: "Welcome, everyone. Today we will discuss database normalization and why it matters for good database design." },
      { t: 255, text: "First Normal Form requires that every column holds a single, atomic value — no repeating groups." },
      { t: 420, text: "Second Normal Form removes partial dependencies: every non-key attribute must depend on the whole primary key." },
      { t: 615, text: "Third Normal Form goes further — no transitive dependencies. Non-key attributes must not depend on other non-key attributes." },
      { t: 820, text: "Functional dependencies describe how one attribute determines another. They are the foundation of normalization." },
      { t: 1215, text: "Let's look at an example. Consider a student enrollment table with repeated course columns — that violates 1NF." },
      { t: 1620, text: "To fix it, we split into separate rows so each course has its own record with a unique key." },
      { t: 2100, text: "Now for 2NF: if part of a composite key determines a non-key attribute, we decompose into two tables." },
      { t: 2850, text: "BCNF is a stronger form of 3NF — every determinant must be a candidate key." },
      { t: 3600, text: "Denormalization, on the other hand, intentionally introduces redundancy for read performance when needed." },
      { t: 4500, text: "In summary: normalization reduces redundancy and anomalies through progressive decomposition." },
      { t: 5400, text: "Any questions? We'll continue with denormalization trade-offs in the next session." },
    ],
    visuals: [
      { t: 140, text: "Database Normalization — Lecture Overview", topic: "Introduction to Normalization" },
      { t: 380, text: "1NF: Atomic values, no repeating groups", topic: "First Normal Form" },
      { t: 640, text: "2NF: No partial dependencies on a composite key", topic: "Second Normal Form" },
      { t: 920, text: "3NF: No transitive dependencies", topic: "Third Normal Form" },
      { t: 1240, text: "Functional Dependency: A → B", topic: "Functional Dependencies" },
      { t: 2720, text: "Boyce-Codd Normal Form (BCNF)", topic: "BCNF" },
      { t: 3320, text: "Denormalization: trading redundancy for speed", topic: "Denormalization" },
    ],
  },
  {
    title: "The TCP/IP Protocol Suite",
    course: "Computer Networks",
    description: "Overview of the TCP/IP model, covering the application, transport, internet, and link layers. We compare TCP and UDP, discuss handshakes, and walk through packet routing.",
    duration: 4200,
    duration_label: "01:10:00",
    lecture_date: "2026-09-10",
    tags: ["networks", "tcp", "ip", "protocols"],
    thumbnail_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    topics: [
      { name: "OSI vs TCP/IP Models", start: 100, end: 400 },
      { name: "Application Layer", start: 400, end: 900 },
      { name: "Transport Layer: TCP vs UDP", start: 900, end: 1800 },
      { name: "Three-Way Handshake", start: 1800, end: 2200 },
      { name: "Internet Layer & IP", start: 2200, end: 3000 },
      { name: "Routing & Subnetting", start: 3000, end: 3600 },
    ],
    transcripts: [
      { t: 110, text: "Today we compare the OSI and TCP/IP models and see how data moves across a network." },
      { t: 420, text: "The application layer includes HTTP, DNS, and SMTP — protocols users interact with directly." },
      { t: 950, text: "TCP is connection-oriented and reliable; UDP is connectionless and fast but does not guarantee delivery." },
      { t: 1850, text: "The three-way handshake — SYN, SYN-ACK, ACK — establishes a TCP connection before data transfer." },
      { t: 2300, text: "At the internet layer, IP handles logical addressing and routing packets across networks." },
      { t: 3100, text: "Subnetting divides a network into smaller segments, controlled by the subnet mask." },
      { t: 4000, text: "In summary, each layer has a distinct responsibility, and they work together for end-to-end delivery." },
    ],
    visuals: [
      { t: 120, text: "OSI 7 layers vs TCP/IP 4 layers", topic: "OSI vs TCP/IP Models" },
      { t: 430, text: "Application Protocols: HTTP, DNS, SMTP", topic: "Application Layer" },
      { t: 960, text: "TCP vs UDP comparison", topic: "Transport Layer: TCP vs UDP" },
      { t: 1860, text: "SYN → SYN-ACK → ACK", topic: "Three-Way Handshake" },
      { t: 2310, text: "IP Addressing & Packet Structure", topic: "Internet Layer & IP" },
      { t: 3110, text: "Subnet Mask: 255.255.255.0", topic: "Routing & Subnetting" },
    ],
  },
  {
    title: "Introduction to Neural Networks",
    course: "Artificial Intelligence",
    description: "We introduce artificial neural networks: perceptrons, activation functions, forward propagation, and the basics of backpropagation. Includes a worked example on a simple dataset.",
    duration: 4800,
    duration_label: "01:20:00",
    lecture_date: "2026-09-05",
    tags: ["ai", "neural networks", "machine learning", "backpropagation"],
    thumbnail_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    topics: [
      { name: "Biological vs Artificial Neurons", start: 100, end: 500 },
      { name: "The Perceptron", start: 500, end: 1000 },
      { name: "Activation Functions", start: 1000, end: 1800 },
      { name: "Forward Propagation", start: 1800, end: 2600 },
      { name: "Loss Functions", start: 2600, end: 3200 },
      { name: "Backpropagation", start: 3200, end: 4200 },
    ],
    transcripts: [
      { t: 120, text: "A neuron receives inputs, weights them, sums them, and applies an activation function to produce an output." },
      { t: 540, text: "The perceptron is the simplest neural network — a single neuron with a step activation function." },
      { t: 1100, text: "Common activation functions include sigmoid, tanh, and ReLU. Each has different properties." },
      { t: 1900, text: "Forward propagation passes input through each layer to produce a prediction." },
      { t: 2700, text: "The loss function measures how far the prediction is from the target. We use gradient descent to minimize it." },
      { t: 3300, text: "Backpropagation computes gradients layer by layer using the chain rule, then updates weights." },
      { t: 4500, text: "In summary, training a neural network is about forward passes, loss, and backward updates." },
    ],
    visuals: [
      { t: 130, text: "Biological Neuron → Artificial Neuron", topic: "Biological vs Artificial Neurons" },
      { t: 550, text: "Perceptron: y = f(w·x + b)", topic: "The Perceptron" },
      { t: 1110, text: "Sigmoid, Tanh, ReLU", topic: "Activation Functions" },
      { t: 1910, text: "Forward Pass: input → hidden → output", topic: "Forward Propagation" },
      { t: 2710, text: "Loss = (prediction - target)²", topic: "Loss Functions" },
      { t: 3310, text: "Backprop: chain rule for gradients", topic: "Backpropagation" },
    ],
  },
];

export async function seedDemoData() {
  const created = [];
  for (const sample of SAMPLE_LECTURES) {
    const lecture = await base44.entities.Lecture.create({
      title: sample.title,
      course: sample.course,
      description: sample.description,
      lecture_date: sample.lecture_date,
      tags: sample.tags,
      file_url: null,
      thumbnail_url: sample.thumbnail_url,
      duration: sample.duration,
      duration_label: sample.duration_label,
      processing_status: "ready",
      processing_progress: 100,
      view_count: 0,
      is_demo: true,
    });

    await base44.entities.Transcript.bulkCreate(
      sample.transcripts.map((s) => ({
        lecture_id: lecture.id,
        timestamp: s.t,
        timestamp_label: formatDuration(s.t),
        text: s.text,
      }))
    );
    await base44.entities.Topic.bulkCreate(
      sample.topics.map((tp) => ({
        lecture_id: lecture.id,
        topic_name: tp.name,
        start_time: tp.start,
        end_time: tp.end,
        start_label: formatDuration(tp.start),
        end_label: formatDuration(tp.end),
      }))
    );
    await base44.entities.VisualContent.bulkCreate(
      sample.visuals.map((v) => ({
        lecture_id: lecture.id,
        timestamp: v.t,
        timestamp_label: formatDuration(v.t),
        extracted_text: v.text,
        related_topic: v.topic,
        image_url: null,
      }))
    );
    created.push({ lecture, sample });
  }

  // Create one demo digest from the first lecture.
  if (created.length > 0) {
    const { lecture, sample } = created[0];
    const selected = sample.topics.slice(0, 4).sort((a, b) => a.start - b.start);
    const digestDuration = selected.reduce((sum, s) => sum + (s.end - s.start), 0);
    const timeSaved = Math.max(0, sample.duration - digestDuration);
    const digest = await base44.entities.Digest.create({
      lecture_id: lecture.id,
      title: "Normalization review digest",
      learning_goal: "Review normalization for my upcoming exam.",
      topics: ["Normalization", "1NF", "2NF", "3NF"],
      purpose: "exam_review",
      depth: "standard",
      duration: Math.round(digestDuration),
      duration_label: compactDuration(digestDuration),
      lecture_duration: sample.duration,
      lecture_duration_label: sample.duration_label,
      estimated_time_saved: Math.round(timeSaved),
      estimated_time_saved_label: compactDuration(timeSaved),
      key_takeaways: [
        "Normalization reduces data redundancy and update anomalies.",
        "1NF requires atomic values — no repeating groups.",
        "2NF removes partial dependencies on a composite key.",
        "3NF removes transitive dependencies between non-key attributes.",
      ],
      related_queries: [
        "what is normalization?",
        "1NF explained",
        "how to understand 2NF",
        "3NF examples",
        "database normalization tutorial",
        "normalization vs denormalization",
        "best resources for database normalization"
      ],
      relevance_explanation: "These sections were selected because they closely match your learning goal: reviewing database normalization for your exam.",
      is_demo: true,
    });
    await base44.entities.DigestSegment.bulkCreate(
      selected.map((s, i) => ({
        digest_id: digest.id,
        lecture_id: lecture.id,
        start_time: s.start,
        end_time: s.end,
        start_label: formatDuration(s.start),
        end_label: formatDuration(s.end),
        topic: s.name,
        explanation: `Covers ${s.name}, matching your selected topics.`,
        relevance_score: 95 - i * 5,
      }))
    );
  }
}