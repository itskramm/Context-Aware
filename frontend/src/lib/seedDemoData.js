/**
 * Seed demo data for development and testing
 */

export const demoUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    name: "Admin User",
    avatar: null,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    username: "john_doe",
    email: "john@example.com",
    role: "user",
    name: "John Doe",
    avatar: null,
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "3",
    username: "jane_smith",
    email: "jane@example.com",
    role: "user",
    name: "Jane Smith",
    avatar: null,
    createdAt: new Date("2024-03-20"),
  },
]

export const demoLectures = [
  {
    id: "1",
    title: "Introduction to React Hooks",
    description: "Learn the basics of React Hooks including useState and useEffect",
    duration: 3600,
    type: "video",
    source: "youtube",
    sourceUrl: "https://youtube.com/watch?v=example1",
    status: "completed",
    uploadedBy: "1",
    createdAt: new Date("2024-10-01"),
    thumbnailUrl: "https://img.youtube.com/vi/example1/hqdefault.jpg",
  },
  {
    id: "2",
    title: "Advanced JavaScript Patterns",
    description: "Deep dive into advanced JavaScript design patterns and best practices",
    duration: 5400,
    type: "video",
    source: "upload",
    sourceUrl: null,
    status: "processing",
    uploadedBy: "2",
    createdAt: new Date("2024-10-15"),
    thumbnailUrl: null,
  },
  {
    id: "3",
    title: "Web Performance Optimization",
    description: "Techniques and strategies for optimizing web application performance",
    duration: 4200,
    type: "video",
    source: "youtube",
    sourceUrl: "https://youtube.com/watch?v=example3",
    status: "completed",
    uploadedBy: "1",
    createdAt: new Date("2024-10-20"),
    thumbnailUrl: "https://img.youtube.com/vi/example3/hqdefault.jpg",
  },
]

export const demoDigests = [
  {
    id: "1",
    lectureId: "1",
    title: "React Hooks Summary",
    content: "This digest covers the key concepts of React Hooks...",
    length: "medium",
    createdBy: "2",
    createdAt: new Date("2024-10-02"),
  },
  {
    id: "2",
    lectureId: "3",
    title: "Performance Tips",
    content: "Key takeaways for web performance optimization...",
    length: "short",
    createdBy: "3",
    createdAt: new Date("2024-10-21"),
  },
]

/**
 * Seed demo data to localStorage
 */
export function seedDemoData() {
  localStorage.setItem("demo_users", JSON.stringify(demoUsers))
  localStorage.setItem("demo_lectures", JSON.stringify(demoLectures))
  localStorage.setItem("demo_digests", JSON.stringify(demoDigests))
  console.log("Demo data seeded successfully")
}

/**
 * Clear demo data from localStorage
 */
export function clearDemoData() {
  localStorage.removeItem("demo_users")
  localStorage.removeItem("demo_lectures")
  localStorage.removeItem("demo_digests")
  console.log("Demo data cleared")
}

/**
 * Check if demo data exists
 */
export function hasDemoData() {
  return (
    localStorage.getItem("demo_users") !== null &&
    localStorage.getItem("demo_lectures") !== null &&
    localStorage.getItem("demo_digests") !== null
  )
}

export default {
  demoUsers,
  demoLectures,
  demoDigests,
  seedDemoData,
  clearDemoData,
  hasDemoData,
}
