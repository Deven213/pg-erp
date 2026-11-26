/* eslint-disable @typescript-eslint/no-require-imports -- isolateModules needs require() to re-read env per test */
describe('UI preview gate', () => {
  const original = process.env.EXPO_PUBLIC_ENABLE_UI_PREVIEW;
  afterEach(() => {
    process.env.EXPO_PUBLIC_ENABLE_UI_PREVIEW = original;
    jest.resetModules();
  });

  it('stays off unless the env flag is set', () => {
    delete process.env.EXPO_PUBLIC_ENABLE_UI_PREVIEW;
    jest.isolateModules(() => {
      const { isUiPreviewEnabled, useUiPreview } = require('../uiPreview') as typeof import('../uiPreview');
      expect(isUiPreviewEnabled).toBe(false);
      useUiPreview.getState().start('owner');
      expect(useUiPreview.getState().role).toBeNull();
    });
  });

  it('can be turned on in development builds', () => {
    process.env.EXPO_PUBLIC_ENABLE_UI_PREVIEW = 'true';
    jest.isolateModules(() => {
      const { isUiPreviewEnabled, useUiPreview } = require('../uiPreview') as typeof import('../uiPreview');
      expect(isUiPreviewEnabled).toBe(true);
      useUiPreview.getState().start('resident');
      expect(useUiPreview.getState().role).toBe('resident');
      useUiPreview.getState().stop();
      expect(useUiPreview.getState().role).toBeNull();
    });
  });
});
