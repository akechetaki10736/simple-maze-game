const startNewGame = () => {
    const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

    const cellsHorizontal = 32;
    const cellsVertical = 24;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const unitLengthX = width / cellsHorizontal;
    const unitLengthY = height / cellsVertical;

    //first step: create a Engine
    const engine = Engine.create();
    engine.world.gravity.y = 0;
    //when we create an engine, we can get a world from it. world is a snapshot of our own differents shapes
    const { world } = engine;
    const render = Render.create({
        //tell render where going to show on the screen (on which element), it will create canvas element
        element: document.body,
        engine: engine,
        // canvas width and height
        options: {
            wireframes: false,
            width,
            height
        }
    });

    // tell render start working and draw everything
    Render.run(render);
    Runner.run(Runner.create(), engine);

    const walls = [
        //left, top, width, height
        Bodies.rectangle(width / 2, 0, width, 2, {
            //disble gravity
            isStatic: true
        }),
        Bodies.rectangle(width / 2, height, width, 2, {
            isStatic: true
        }),
        Bodies.rectangle(0, height / 2, 2, height, {
            isStatic: true
        }),
        Bodies.rectangle(width, height / 2, 2, height, {
            isStatic: true
        })
    ];

    World.add(world, walls);

    // Maze Generation
    const shuffle = (arr) => {
        let counter = arr.length;

        while (counter > 0) {
            const index = Math.floor(Math.random() * counter);
            counter--;
            
            // const temp = arr[counter];
            // arr[counter] = arr[index];
            // arr[index] = temp;
            [arr[counter], arr[index]] = [arr[index], arr[counter]];
        }
        return arr;
    }

    // why we can just use Array(3).fill(false), because the new three array will have same reference
    // use map's feature, it will return new array
    const grid = Array(cellsVertical).fill().map(() => Array(cellsHorizontal).fill(false));
    const verticals = Array(cellsVertical).fill().map(() => Array(cellsHorizontal - 1).fill(false));
    const horizontals = Array(cellsVertical - 1).fill().map(() => Array(cellsHorizontal).fill(false));

    // Pick a random start point
    const startRow = Math.floor(Math.random() * cellsVertical);
    const startColumn = Math.floor(Math.random() * cellsHorizontal);

    const stepThroughCell = (row, column) => {
        // if I have visted the cell at [row, column], then return
        if (grid[row][column]) {
            return;
        }

        // Mark this cell as being visited
        grid[row][column] = true;

        // Assemble randomly-ordered list of neighbors
        const neighbors = shuffle([
            [row - 1, column, 'up'], //above
            [row, column + 1, 'right'], //right
            [row + 1, column, 'down'], //below
            [row, column - 1, 'left']  //left
        ]);
        // For each neighbor...
        for (let neighbor of neighbors) {
            const [nextRow, nextColumn, direction] = neighbor;
        // See if that neighbor is out of bounds
            if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
                continue;
            }
        // if we have visited that neightbor, continue to next neighbor
            if (grid[nextRow][nextColumn]) {
                continue;
            }
        // Remove a wall from either horizontals or verticals
            if (direction === 'left') {
                verticals[row][column - 1] = true;
            } else if (direction === 'right') {
                verticals[row][column] = true;
            } else if (direction === 'up') {
                horizontals[row - 1][column] = true;
            } else if (direction === 'down') {
                horizontals[row][column] = true;
            }

            stepThroughCell(nextRow, nextColumn);
        }
        // visit that next cell
    };

    stepThroughCell(startRow, startColumn);

    horizontals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX,
                5,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: '#5B00AE'
                    }
                }
            );
            World.add(world, wall);
        });
    });

    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                5,
                unitLengthY,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: '#5B00AE'
                    }
                }
            );
            World.add(world, wall);
        });
    });

    //Goal

    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * 0.7,
        unitLengthY * 0.7,
        {
            isStatic: true,
            label: 'goal',
            render: {
                fillStyle: 'green'
            }
        }
    );

    World.add(world, goal);

    // Ball
    const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius,
        {
            label: 'ball',
            render: {
                fillStyle: '#FF8F59'
            }
        }
    );

    World.add(world, ball);

    // Movement
    document.addEventListener('keydown', (event) => {
        const { x, y } = ball.velocity;
        if (event.keyCode === 87) {
            //set speed
            Body.setVelocity(ball, { x, y: y - 3 });
        }
        if (event.keyCode === 68) {
            Body.setVelocity(ball, { x: x + 3 , y });
        }
        if (event.keyCode === 83) {
            Body.setVelocity(ball, { x, y: y + 3 });
        }
        if (event.keyCode === 65) {
            Body.setVelocity(ball, { x: x - 3, y });
        }
    });

    // Win condition

    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach((collision) => {
            const labels = ['ball', 'goal'];
            if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
                document.querySelector('.winner').classList.remove('hidden');               
                world.gravity.y = 1;
                world.bodies.forEach((body) => {
                    if (body.label === 'wall') {
                        Body.setStatic(body, false);
                    }
                })
            }
        });
    });
};

startNewGame();

const replayBtn = document.querySelector('#replay');
replayBtn.addEventListener('click', () => {
    document.querySelector('canvas').remove();
    document.querySelector('.winner').classList.add('hidden');
    startNewGame();
});