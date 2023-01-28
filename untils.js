function random(numbers, ...args) {
  if (numbers === null || numbers === void 0) {
    return Math.random()
  }
  if (Array.isArray(numbers)) {
    return numbers[Math.floor(Math.random() * numbers.length)]
  }
  if (args.length > 1) {
    numbers = [numbers].concat(args)
    return numbers[Math.floor(Math.random() * numbers.length)]
  }
  const min = numbers
  const max = args[0]
  return Math.random() * (max - min) + min
}
