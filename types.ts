
export enum GameState {
  Menu,
  Playing,
  Paused,
  GameOver,
  Highscores,
  Rules,
  Settings,
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Rect extends Vector2D, Size {}

export enum PowerUpType {
  ExtraHealth,
  Shield,
  DoubleAttack,
}

export type Highscore = {
  name: string;
  score: number;
};

export interface Entity {
  id: number;
  position: Vector2D;
  size: Size;
  velocity: Vector2D;
  hp: number;
  maxHp: number;
  damage: number;
  dead: boolean;
  update(td: number, game: any): void;
  draw(ctx: CanvasRenderingContext2D, game: any): void;
  die(game: any): void;
}
