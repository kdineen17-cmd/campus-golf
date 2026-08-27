import { Share } from "react-native";

// Custom-scheme deep links (mobile/app.json's "scheme": "campusgolf"). Only
// resolve if the recipient already has the app installed -- there's no web
// fallback page yet.
export function courseShareUrl(courseId: string): string {
  return `campusgolf://course/${courseId}`;
}

export function userShareUrl(userId: string, username: string): string {
  return `campusgolf://user/${userId}/${encodeURIComponent(username)}`;
}

export async function shareCourse(courseId: string, name: string) {
  const url = courseShareUrl(courseId);
  await Share.share({
    title: name,
    message: `Play "${name}" on Home Course: ${url}`,
    url,
  });
}

export async function shareProfile(userId: string, username: string) {
  const url = userShareUrl(userId, username);
  await Share.share({
    title: username,
    message: `Add me on Home Course: ${url}`,
    url,
  });
}
