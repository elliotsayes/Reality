/**
 * Format time to twitter style ones
 * @param time timestamp in seconds
 * @param ago the 'ago' suffix
 * @returns the time formatted
 */
export function formatTimestamp(time: number, ago?: boolean) {
  const m = new Map([
    [1, "Jan"],
    [2, "Feb"],
    [3, "Mar"],
    [4, "Apr"],
    [5, "May"],
    [6, "Jun"],
    [7, "Jul"],
    [8, "Aug"],
    [9, "Sep"],
    [10, "Oct"],
    [11, "Nov"],
    [12, "Dec"],
  ]);

  const now = secondsOfNow();
  const diff = now - time;

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = Math.floor(diff % 60);

  if (days > 0) {
    const date = new Date(time * 1000);

    if (days > 365) {
      return date.toLocaleString();
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return m.get(month) + " " + day;
    }
  }

  if (hours > 0) {
    let t = hours + "h";
    if (ago) t += " ago";
    return t;
  }

  if (minutes > 0) {
    let t = minutes + "m";
    if (ago) t += " ago";
    return t;
  }

  if (seconds > 0) {
    let t = seconds + "s";
    if (ago) t += " ago";
    return t;
  }

  return "just now";
}

/**
 * Gets the time value of now in seconds.
 * @returns the time value in seconds
 */
export function secondsOfNow() {
  return Math.floor(new Date().getTime() / 1000);
}
