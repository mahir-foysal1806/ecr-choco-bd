export const BRAND = { en: 'ECR Choco BD', bn: 'ইসিআর চকো বিডি' };

export const GIFT_BOX_SIZES = [
  { id: 'small', label: 'Small Box', slots: 6, cols: 3 },
  { id: 'medium', label: 'Medium Box', slots: 12, cols: 4 },
  { id: 'large', label: 'Large Box', slots: 20, cols: 5 },
];

export const ORDER_STEPS = ['pending', 'processing', 'shipped', 'delivered'];
export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refunded'];

export const STATUS_TONE = {
  pending: 'amber',
  processing: 'blue',
  shipped: 'violet',
  delivered: 'green',
  cancelled: 'red',
  unpaid: 'amber',
  paid: 'green',
  failed: 'red',
  refunded: 'gray',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];
