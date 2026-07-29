Component({
  properties: {
    chips: { type: Array, value: [] },
    value: { type: String, value: '' },
  },
  methods: {
    onSelect(e) {
      const item = e.currentTarget.dataset.item;
      this.triggerEvent('select', { value: item });
    },
  },
});
