/** A value made deeply reactive, as the layout store's tree is: a proxy that cannot be cloned. */
export function deepState<T extends object>(value: T): T {
  const live = $state(value)
  return live
}
