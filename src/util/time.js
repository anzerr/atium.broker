
const NS_PER_SEC = 1e9;
module.exports = (diff) => diff[0] * NS_PER_SEC + diff[1];
