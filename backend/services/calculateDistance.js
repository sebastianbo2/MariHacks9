function calculateDistance(userLat, userLon, busLat, busLon) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(busLat - userLat);
    const dLon = toRadians(busLon - userLon);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(userLat)) * Math.cos(toRadians(busLat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

export default calculateDistance;