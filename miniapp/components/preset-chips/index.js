Component({
  properties: {
    options: {
      type: Array,
      value: [],
    },
    value: {
      type: String,
      value: '',
    },
  },
  methods: {
    handleSelect(event) {
      this.triggerEvent('select', {
        value: event.currentTarget.dataset.value,
        label: event.currentTarget.dataset.label,
      });
    },
  },
});
