Component({
  properties: {
    primaryText: { type: String, value: '确定' },
    secondaryText: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    onPrimary() {
      if (this.data.disabled) return;
      this.triggerEvent('primary');
    },
    onSecondary() {
      this.triggerEvent('secondary');
    },
  },
});
