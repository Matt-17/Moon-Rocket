import Phaser from 'phaser';

/**
 * Zentrale Schriftstile für das Spiel.
 * Einfach erweitern oder anpassen, um neue Styles hinzuzufügen.
 */
export class TextStyles {
  // =============================================================================
  // MAIN TITLE STYLES
  // =============================================================================
  
  /** Großes rotes Titel‑Label mit Kontur für bessere Lesbarkeit */
  public static readonly TITLE_RED: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '48px',
    color: '#f7323c',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
  };

  /** Großes grünes Titel‑Label mit Kontur */
  public static readonly TITLE_GREEN: Phaser.Types.GameObjects.Text.TextStyle = {
    ...TextStyles.TITLE_RED,
    color: '#1ec51e',
  };

  /** Großes weißes Titel‑Label */
  public static readonly TITLE_WHITE: Phaser.Types.GameObjects.Text.TextStyle = {
    ...TextStyles.TITLE_RED,
    color: '#ffffff',
  };

  // =============================================================================
  // SUBTITLE & HEADER STYLES
  // =============================================================================

  /** Mittelgroße Überschrift »weiß« mit Kontur */
  public static readonly SUBTITLE: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '32px',
    color: '#ffffff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
  };

  /** Mittelgroße Überschrift »yellow« mit Kontur */
  public static readonly SUBTITLE_YELLOW: Phaser.Types.GameObjects.Text.TextStyle = {
    ...TextStyles.SUBTITLE,
    color: '#ffff88',
  };

  /** Kleinere Überschrift */
  public static readonly HEADER: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '24px',
    color: '#ffffff',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
  };

  // =============================================================================
  // BODY & CONTENT STYLES
  // =============================================================================

  /** Gelber Hinweis‑ oder Body‑Text */
  public static readonly BODY: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '24px',
    color: '#ffff88',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
  };

  /** Normaler weißer Body-Text */
  public static readonly BODY_WHITE: Phaser.Types.GameObjects.Text.TextStyle = {
    ...TextStyles.BODY,
    color: '#ffffff',
  };

  /** Kleiner Fließtext */
  public static readonly SMALL: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '16px',
    color: '#cccccc',
    align: 'left',
  };

  // =============================================================================
  // UI & HUD STYLES
  // =============================================================================

  /** Kleine weiße HUD‑Anzeige (Score etc.) mit Kontur */
  public static readonly SCORE: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '16px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2,
  };

  /** Größere Score-Anzeige */
  public static readonly SCORE_LARGE: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '16px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2,
  };

  /** Grüner Button‑Text mit Kontur */
  public static readonly BUTTON: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '24px',
    color: '#1ec51e',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
  };

  /** Roter Warn- oder Fehlertext */
  public static readonly WARNING: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Kenney',
    fontSize: '20px',
    color: '#ff6666',
    align: 'center',
    stroke: '#000000',
    strokeThickness: 2,
  };

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Style kopieren und Farbe ändern.
   * @example TextStyles.withColor(TextStyles.TITLE_RED, '#00aaff')
   */
  public static withColor(
    base: Phaser.Types.GameObjects.Text.TextStyle,
    color: string,
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return { ...base, color };
  }

  /**
   * Style kopieren und Schriftgröße ändern.
   * @example TextStyles.withFontSize(TextStyles.BODY, '32px')
   */
  public static withFontSize(
    base: Phaser.Types.GameObjects.Text.TextStyle,
    fontSize: string,
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return { ...base, fontSize };
  }

  /**
   * Style kopieren und Ausrichtung ändern.
   * @example TextStyles.withAlign(TextStyles.BODY, 'left')
   */
  public static withAlign(
    base: Phaser.Types.GameObjects.Text.TextStyle,
    align: 'left' | 'center' | 'right',
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return { ...base, align };
  }

  /**
   * Style kopieren und Kontur entfernen (für bessere Performance wenn nicht nötig).
   * @example TextStyles.withoutStroke(TextStyles.TITLE_RED)
   */
  public static withoutStroke(
    base: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.Types.GameObjects.Text.TextStyle {
    const { stroke, strokeThickness, ...styleWithoutStroke } = base;
    return styleWithoutStroke;
  }

  /**
   * Hilfsmethode: Text mit automatischer Auflösung erstellen.
   * Erspart das manuelle .setResolution(4) bei jedem Text.
   * @example TextStyles.createText(scene, x, y, 'Hello', TextStyles.TITLE_GREEN)
   */
  public static createText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    resolution: number = 4
  ): Phaser.GameObjects.Text {
    return scene.add
      .text(x, y, text, style)
      .setResolution(resolution);
  }
}