class TimerRegistry extends Map {
  clearTimer(key) {
    const timer = this.get(key);
    if (timer) clearTimeout(timer);
    return this.delete(key);
  }
}

module.exports = { TimerRegistry };
