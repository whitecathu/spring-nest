Component({
  properties: {
    primaryText: {
      type: String,
      value: '开始',
    },
    secondaryText: {
      type: String,
      value: '',
    },
  },
  methods: {
    handlePrimary() {
      this.triggerEvent('primary');
    },
    handleSecondary() {
      this.triggerEvent('secondary');
    },
  },
});
