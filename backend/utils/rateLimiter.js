const rateMap = new Map();

function isRateLimited(key, limitMs = 60 * 1000) {
    const now = Date.now();
    const last = rateMap.get(key);

    if (last && now - last < limitMs) return true;

    rateMap.set(key, now);
    return false;
}

module.exports = { isRateLimited };