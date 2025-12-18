import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Entity, Vector2D, Size, PowerUpType } from '../types';
import Button from './ui/Button';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const HUD_HEIGHT = 70;
const LEVEL_GOALS = [500, 1500, 3000]; // Score needed to complete level 1, 2, and 3

// --- UTILITY & DRAWING FUNCTIONS ---
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const rectCollision = (rect1: { position: Vector2D, size: Size }, rect2: { position: Vector2D, size: Size }) => {
    return (
        rect1.position.x < rect2.position.x + rect2.size.w &&
        rect1.position.x + rect1.size.w > rect2.position.x &&
        rect1.position.y < rect2.position.y + rect2.size.h &&
        rect1.position.y + rect1.size.h > rect2.position.y
    );
};
const isClickInRect = (click: Vector2D, rect: { x: number, y: number, w: number, h: number }) => {
    return click.x > rect.x && click.x < rect.x + rect.w && click.y > rect.y && click.y < rect.y + rect.h;
};

// --- ENTITY CLASSES ---
let entityIdCounter = 0;
let notificationIdCounter = 0;

class GameObject implements Entity {
    id: number;
    position: Vector2D;
    size: Size;
    velocity: Vector2D;
    hp: number;
    maxHp: number;
    damage: number;
    dead: boolean = false;

    constructor(position: Vector2D, size: Size, velocity: Vector2D = { x: 0, y: 0 }, hp: number = 1, damage: number = 0) {
        this.id = entityIdCounter++;
        this.position = position;
        this.size = size;
        this.velocity = velocity;
        this.hp = hp;
        this.maxHp = hp;
        this.damage = damage;
    }

    update(td: number, game: GameController) {
        this.position.x += this.velocity.x * td;
        this.position.y += this.velocity.y * td;
        if (this.hp <= 0) this.dead = true;
    }
    
    draw(ctx: CanvasRenderingContext2D, game: GameController) {
        ctx.fillStyle = 'magenta'; // Fallback color
        ctx.fillRect(this.position.x, this.position.y, this.size.w, this.size.h);
    }
    
    die(game: GameController) {}
}

class Player extends GameObject {
    speed = 350;
    fireCooldown = 0.25;
    lastFireTime = 0;
    
    shieldActive = false;
    shieldTimer = 0;
    doubleAttackActive = false;
    doubleAttackTimer = 0;
    
    constructor(position: Vector2D) {
        super(position, { w: 32, h: 32 }, { x: 0, y: 0 }, 100, 50);
    }

    update(td: number, game: GameController) {
        super.update(td, game);

        // Movement
        this.velocity.x = 0;
        this.velocity.y = 0;
        if (game.keysPressed['ArrowUp']) this.velocity.y = -this.speed;
        if (game.keysPressed['ArrowDown']) this.velocity.y = this.speed;
        if (game.keysPressed['ArrowLeft']) this.velocity.x = -this.speed;
        if (game.keysPressed['ArrowRight']) this.velocity.x = this.speed;

        this.position.x = Math.max(0, Math.min(CANVAS_WIDTH - this.size.w, this.position.x));
        this.position.y = Math.max(HUD_HEIGHT, Math.min(CANVAS_HEIGHT - this.size.h, this.position.y));
        
        // Firing
        if (game.keysPressed[' '] && game.time > this.lastFireTime + this.fireCooldown) {
            this.fire(game);
        }

        // Power-up timers
        if (this.shieldActive) {
            this.shieldTimer -= td;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }
        if (this.doubleAttackActive) {
            this.doubleAttackTimer -= td;
            if (this.doubleAttackTimer <= 0) {
                this.doubleAttackActive = false;
                this.fireCooldown = 0.25;
            }
        }
    }
    
    fire(game: GameController) {
        this.lastFireTime = game.time;
        const projectilePos = { x: this.position.x + this.size.w, y: this.position.y + this.size.h / 2 - 2 };
        game.addPlayerProjectile(new Projectile(projectilePos, { x: 600, y: 0 }, 'player'));
    }

    takeDamage(amount: number) {
        if (!this.shieldActive) {
            this.hp -= amount;
        }
    }

    activatePowerUp(type: PowerUpType, game: GameController) {
        switch(type) {
            case PowerUpType.ExtraHealth:
                this.hp = Math.min(this.maxHp, this.hp + 25);
                game.addNotification("HEALTH +25");
                break;
            case PowerUpType.Shield:
                this.shieldActive = true;
                this.shieldTimer = 15; // 15 seconds
                game.addNotification("SHIELD ACTIVATED");
                break;
            case PowerUpType.DoubleAttack:
                this.doubleAttackActive = true;
                this.doubleAttackTimer = 8; // 8 seconds
                this.fireCooldown = 0.12; // Double fire rate
                game.addNotification("DOUBLE ATTACK");
                break;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameController) {
        ctx.fillStyle = this.doubleAttackActive ? '#f97316' : '#3b82f6';
        ctx.fillRect(this.position.x, this.position.y, this.size.w, this.size.h);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.position.x + this.size.w - 12, this.position.y + this.size.h/2 - 4, 8, 8);


        if (this.shieldActive) {
            ctx.globalAlpha = 0.5 + Math.sin(game.time * 10) * 0.2;
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.position.x - 5, this.position.y - 5, this.size.w + 10, this.size.h + 10);
            ctx.globalAlpha = 1;
        }
    }

    die(game: GameController) {
        game.addEffect(new Explosion(this.position, 100));
        game.setGameOver();
    }
}

class Enemy extends GameObject {
    scoreValue: number;
    fireRate: number;
    lastFire: number;
    color: string;

    constructor(position: Vector2D, velocity: Vector2D, size: Size, hp: number, score: number, fireRate: number = 0) {
        super(position, size, velocity, hp, hp);
        this.scoreValue = score;
        this.fireRate = fireRate;
        this.lastFire = 0;
        this.color = ['#ef4444', '#dc2626', '#b91c1c'][Math.floor(random(0,3))];
    }
    
    update(td: number, game: GameController) {
        super.update(td, game);
        if (this.position.x + this.size.w < 0) this.dead = true;

        if (this.fireRate > 0 && game.time > this.lastFire + this.fireRate) {
            if (this.position.x < CANVAS_WIDTH) {
                this.lastFire = game.time;
                const pPos = {x: this.position.x, y: this.position.y + this.size.h / 2};
                game.addEnemyProjectile(new Projectile(pPos, {x: -300, y: 0}, 'enemy', 10));
            }
        }
    }
    
    draw(ctx: CanvasRenderingContext2D, game: GameController) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.w, this.size.h);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(this.position.x + 5, this.position.y + this.size.h/2 - 5, 10, 10);
    }
    
    die(game: GameController) {
        game.increaseScore(this.scoreValue);
        game.addEffect(new Explosion(this.position, 20));
        if (Math.random() < 0.2) { // 20% chance to drop a power-up
            game.addPowerUp(new PowerUp(this.position));
        }
    }
}

class Projectile extends GameObject {
    owner: 'player' | 'enemy';
    constructor(position: Vector2D, velocity: Vector2D, owner: 'player' | 'enemy', damage = 10) {
        super(position, { w: 15, h: 4 }, velocity, 1, damage);
        this.owner = owner;
    }

    update(td: number, game: GameController) {
        super.update(td, game);
        if (this.position.x > CANVAS_WIDTH || this.position.x < 0) {
            this.dead = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameController) {
        ctx.fillStyle = this.owner === 'player' ? '#fde047' : '#f97316';
        ctx.fillRect(this.position.x, this.position.y, this.size.w, this.size.h);
    }
}

class PowerUp extends GameObject {
    type: PowerUpType;
    color: string;

    constructor(position: Vector2D) {
        const typeIndex = Math.floor(random(0, Object.keys(PowerUpType).length / 2));
        const type = typeIndex as PowerUpType;
        super(position, {w: 20, h: 20}, {x: -60, y: 0}, 1, 0);
        this.type = type;

        switch (type) {
            case PowerUpType.ExtraHealth: this.color = '#22c55e'; break;
            case PowerUpType.Shield: this.color = '#0ea5e9'; break;
            case PowerUpType.DoubleAttack: this.color = '#f59e0b'; break;
            default: this.color = '#a855f7';
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameController) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.w, this.size.h);
    }
}

class Particle extends GameObject {
    life: number;
    constructor(position: Vector2D, velocity: Vector2D, life: number, size: Size) {
        super(position, size, velocity);
        this.life = life;
    }
    update(td: number, game: GameController) {
        super.update(td, game);
        this.life -= td;
        if (this.life <= 0) this.dead = true;
    }
    draw(ctx: CanvasRenderingContext2D, game: GameController) {
        ctx.globalAlpha = Math.max(0, this.life / 0.5);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(this.position.x, this.position.y, this.size.w, this.size.h);
        ctx.globalAlpha = 1;
    }
}

class Explosion extends GameObject {
    particleCount: number;
    constructor(position: Vector2D, particleCount: number) {
        super(position, {w:0, h:0});
        this.dead = true;
        this.hp = 0;
        this.particleCount = particleCount;
    }
}

// --- GAME CONTROLLER INTERFACE ---
interface GameController {
    time: number;
    keysPressed: { [key: string]: boolean };
    addPlayerProjectile: (p: Projectile) => void;
    addEnemyProjectile: (p: Projectile) => void;
    addEffect: (e: GameObject) => void;
    addPowerUp: (p: PowerUp) => void;
    addNotification: (text: string) => void;
    increaseScore: (amount: number) => void;
    setGameOver: () => void;
    exitGame: () => void;
}


// --- REACT COMPONENT ---
interface GameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
}

const CONFIRM_YES_RECT = { x: CANVAS_WIDTH / 2 - 120, y: CANVAS_HEIGHT / 2 + 20, w: 100, h: 50 };
const CONFIRM_NO_RECT = { x: CANVAS_WIDTH / 2 + 20, y: CANVAS_HEIGHT / 2 + 20, w: 100, h: 50 };

type Notification = { id: number; text: string; life: number; y: number };

const Game: React.FC<GameProps> = ({ onGameOver, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const lastTime = useRef<number>(0);

    const [paused, setPaused] = useState(false);
    const [exitConfirm, setExitConfirm] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [levelTransition, setLevelTransition] = useState(false);

    const player = useRef<Player>(new Player({ x: 50, y: CANVAS_HEIGHT / 2 - 10 }));
    const enemies = useRef<Enemy[]>([]);
    const playerProjectiles = useRef<Projectile[]>([]);
    const enemyProjectiles = useRef<Projectile[]>([]);
    const powerups = useRef<PowerUp[]>([]);
    const effects = useRef<GameObject[]>([]);
    const notifications = useRef<Notification[]>([]);
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const gameTime = useRef(0);
    const nextEnemyTime = useRef(0);
    const nextPowerUpTime = useRef(0);
    
    const gameController: GameController = {
        get time() { return gameTime.current; },
        get keysPressed() { return keysPressed.current; },
        addPlayerProjectile: (p) => playerProjectiles.current.push(p),
        addEnemyProjectile: (p) => enemyProjectiles.current.push(p),
        addEffect: (e) => {
             if (e instanceof Explosion) {
                for (let i = 0; i < e.particleCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 150 + 50;
                    const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
                    const life = Math.random() * 0.5 + 0.2;
                    const size = Math.random() * 4 + 2;
                    effects.current.push(new Particle({...e.position}, velocity, life, {w: size, h: size}));
                }
             } else { effects.current.push(e) }
        },
        addPowerUp: (p) => powerups.current.push(p),
        addNotification: (text: string) => {
            notifications.current.push({ id: notificationIdCounter++, text, life: 3, y: HUD_HEIGHT + 40 });
        },
        increaseScore: (amount) => setScore(s => s + amount),
        setGameOver: () => onGameOver(score),
        exitGame: () => { setPaused(true); setExitConfirm(true); },
    };

    const handlePauseToggle = useCallback(() => {
        if (!exitConfirm && !levelTransition) {
            setPaused(p => !p);
        }
    }, [exitConfirm, levelTransition]);

    const resetGame = useCallback(() => {
        setScore(0);
        setLevel(1);
        setLevelTransition(false);
        gameTime.current = 0;
        nextEnemyTime.current = 3;
        nextPowerUpTime.current = random(7, 12);
        player.current = new Player({ x: 50, y: CANVAS_HEIGHT / 2 - 16 });
        enemies.current = [];
        playerProjectiles.current = [];
        enemyProjectiles.current = [];
        powerups.current = [];
        effects.current = [];
        notifications.current = [];
    }, []);

    const startNextLevelTransition = useCallback(() => {
        setLevelTransition(true);
        setTimeout(() => {
            const nextLvl = level + 1;
            if (nextLvl > LEVEL_GOALS.length) {
                gameController.setGameOver();
                return;
            }
            setLevel(nextLvl);
            enemies.current = [];
            enemyProjectiles.current = [];
            playerProjectiles.current = [];
            powerups.current = [];
            effects.current = [];
            player.current.position = { x: 50, y: CANVAS_HEIGHT / 2 - 16 };
            nextEnemyTime.current = gameTime.current + 3; // Give a breather
            setLevelTransition(false);
        }, 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level]);

    const gameLoop = useCallback((timestamp: number) => {
        if (lastTime.current === 0) lastTime.current = timestamp;
        const td = (timestamp - lastTime.current) / 1000;
        lastTime.current = timestamp;
        
        // Update notifications regardless of pause state
        notifications.current.forEach(n => {
            n.life -= td;
            n.y -= 15 * td; // Float up
        });
        notifications.current = notifications.current.filter(n => n.life > 0);

        if (!paused && !levelTransition) {
            gameTime.current += td;

            // --- LEVEL COMPLETION CHECK ---
            if (level <= LEVEL_GOALS.length && score >= LEVEL_GOALS[level - 1]) {
                startNextLevelTransition();
            }

            // --- UPDATE ---
            player.current.update(td, gameController);
            if(player.current.dead) {
                player.current.die(gameController);
                return;
            }
            
            // Spawn Enemies
            if (gameTime.current > nextEnemyTime.current) {
                const y = random(HUD_HEIGHT, CANVAS_HEIGHT - 30);
                const hp = random(20, 50) + (level - 1) * 20;
                const scoreValue = 10 * level;
                const fireRate = Math.random() < (0.2 + level * 0.1) ? random(2, 4) / level : 0;
                enemies.current.push(new Enemy({x: CANVAS_WIDTH, y}, {x: -100 - (level*10), y: 0}, {w: 30, h: 30}, hp, scoreValue, fireRate));
                nextEnemyTime.current = gameTime.current + random(0.5, 1.5) / level;
            }

            // Spawn Power-ups
            if (gameTime.current > nextPowerUpTime.current) {
                const pPos = { x: random(0, CANVAS_WIDTH - 24), y: random(HUD_HEIGHT, CANVAS_HEIGHT - 24) };
                const powerUp = new PowerUp(pPos);
                powerUp.velocity = {x: 0, y: 0}; // Static power-up
                powerups.current.push(powerUp);
                nextPowerUpTime.current = gameTime.current + random(7, 12);
            }
            
            [...enemies.current, ...playerProjectiles.current, ...enemyProjectiles.current, ...powerups.current, ...effects.current].forEach(e => e.update(td, gameController));

            // --- COLLISIONS ---
            playerProjectiles.current.forEach(p => {
                enemies.current.forEach(e => {
                    if (!p.dead && !e.dead && rectCollision(p, e)) { p.dead = true; e.hp -= p.damage; }
                });
            });
            enemyProjectiles.current.forEach(p => {
                if(!p.dead && !player.current.dead && rectCollision(p, player.current)){ p.dead = true; player.current.takeDamage(5); }
            });
            enemies.current.forEach(e => {
                 if(!e.dead && !player.current.dead && rectCollision(e, player.current)){ player.current.takeDamage(5); e.hp -= player.current.damage; }
            });
            powerups.current.forEach(p => {
                if(!p.dead && !player.current.dead && rectCollision(p, player.current)) { p.dead = true; player.current.activatePowerUp(p.type, gameController); }
            });

            // --- CLEANUP ---
            const cleanup = (arr: React.MutableRefObject<Entity[]>) => {
                const deadEntities = arr.current.filter(e => e.dead);
                deadEntities.forEach(e => e.die(gameController));
                arr.current = arr.current.filter(e => !e.dead);
            };
            cleanup(enemies as React.MutableRefObject<Entity[]>);
            cleanup(playerProjectiles as React.MutableRefObject<Entity[]>);
            cleanup(enemyProjectiles as React.MutableRefObject<Entity[]>);
            cleanup(powerups as React.MutableRefObject<Entity[]>);
            cleanup(effects as React.MutableRefObject<Entity[]>);
        }

        // --- DRAW ---
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const darkTheme = document.documentElement.classList.contains('dark');
            // Background
            ctx.fillStyle = darkTheme ? '#111827' : '#e5e7eb';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Entities
            if (!player.current.dead) player.current.draw(ctx, gameController);
            [...enemies.current, ...playerProjectiles.current, ...enemyProjectiles.current, ...powerups.current, ...effects.current].forEach(e => e.draw(ctx, gameController));
            
            // HUD
            ctx.fillStyle = darkTheme ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
            ctx.strokeStyle = darkTheme ? '#4b5563' : '#9ca3af';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

            ctx.fillStyle = darkTheme ? 'white' : 'black';
            ctx.font = '16px "Press Start 2P"';
            ctx.fillText(`Score: ${score}`, 10, 30);
            ctx.fillText(`Level: ${level}`, 10, 55);
            
            // Health Bar & Text
            ctx.font = '14px "Press Start 2P"';
            const healthText = `${player.current.hp}/${player.current.maxHp}`;
            ctx.fillText(healthText, CANVAS_WIDTH - 210, 25);
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(CANVAS_WIDTH - 210, 35, 200, 20);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(CANVAS_WIDTH - 210, 35, Math.max(0, (player.current.hp / player.current.maxHp) * 200), 20);
            ctx.strokeStyle = darkTheme ? 'white' : 'black';
            ctx.strokeRect(CANVAS_WIDTH - 210, 35, 200, 20);

            // Notifications
            ctx.font = '18px "Press Start 2P"';
            ctx.textAlign = 'center';
            notifications.current.forEach(n => {
                ctx.globalAlpha = Math.max(0, Math.min(1, n.life));
                ctx.fillStyle = '#fde047'; // yellow color for notifications
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 5;
                ctx.fillText(n.text, CANVAS_WIDTH / 2, n.y);
            });
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';

            // Overlays
            if(levelTransition) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.fillStyle = 'white';
                ctx.font = '40px "Press Start 2P"';
                ctx.textAlign = 'center';
                const nextLvl = level + 1;
                ctx.fillText(`LEVEL ${level} COMPLETE`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
                 if (nextLvl <= LEVEL_GOALS.length) {
                    ctx.font = '24px "Press Start 2P"';
                    ctx.fillText(`Prepare for Level ${nextLvl}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
                } else {
                    ctx.font = '24px "Press Start 2P"';
                    ctx.fillText(`YOU ARE VICTORIOUS!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
                }
                ctx.textAlign = 'left';
            } else if (paused) {
                 ctx.fillStyle = 'rgba(0,0,0,0.7)';
                 ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                 ctx.fillStyle = 'white';
                 ctx.font = '50px "Press Start 2P"';
                 ctx.textAlign = 'center';

                 if (exitConfirm) {
                    ctx.fillText('EXIT?', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(CONFIRM_YES_RECT.x, CONFIRM_YES_RECT.y, CONFIRM_YES_RECT.w, CONFIRM_YES_RECT.h);
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(CONFIRM_NO_RECT.x, CONFIRM_NO_RECT.y, CONFIRM_NO_RECT.w, CONFIRM_NO_RECT.h);
                    ctx.fillStyle = 'white';
                    ctx.font = '24px "Press Start 2P"';
                    ctx.fillText('YES', CONFIRM_YES_RECT.x + CONFIRM_YES_RECT.w/2, CONFIRM_YES_RECT.y + 32);
                    ctx.fillText('NO', CONFIRM_NO_RECT.x + CONFIRM_NO_RECT.w/2, CONFIRM_NO_RECT.y + 32);
                 } else {
                    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                 }
                 ctx.textAlign = 'left';
            }
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paused, score, exitConfirm, level, levelTransition]);

    useEffect(() => {
        resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
                handlePauseToggle();
            } else {
                keysPressed.current[e.key] = true;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = false;
        };

        const handleCanvasClick = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const clickPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            if (paused && exitConfirm) {
                if(isClickInRect(clickPos, CONFIRM_YES_RECT)) onExit();
                if(isClickInRect(clickPos, CONFIRM_NO_RECT)) { setPaused(false); setExitConfirm(false); }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvasRef.current?.addEventListener('click', handleCanvasClick);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            canvasRef.current?.removeEventListener('click', handleCanvasClick);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameLoop, onExit, handlePauseToggle]);

    return (
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="cursor-crosshair"/>
            <div className="absolute top-[18px] left-1/2 -translate-x-1/2 flex items-center space-x-4 z-10">
                <Button
                    onClick={handlePauseToggle}
                    disabled={exitConfirm || levelTransition}
                    className="!w-28 !text-sm !py-1"
                >
                    {paused && !exitConfirm ? 'Resume' : 'Pause'}
                </Button>
                <Button
                    onClick={gameController.exitGame}
                    disabled={exitConfirm || levelTransition}
                    className="!w-28 !text-sm !py-1"
                >
                    Exit
                </Button>
            </div>
        </div>
    );
};

export default Game;
