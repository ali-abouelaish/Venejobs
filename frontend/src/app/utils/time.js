export const getPostedTime = (dateString) => {
    if (!dateString) return "";

    const createdDate = new Date(dateString);
    const now = new Date();

    const diffMs = now - createdDate;
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Posted just now";
    if (minutes < 60) return `Posted ${minutes} min ago`;
    if (hours < 24) return `Posted ${hours} hours ago`;
    if (days === 1) return "Posted yesterday";

    return `Posted ${days} days ago`;
};
