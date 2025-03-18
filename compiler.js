const lexer = (input) => {
    const tokens = [];
    let cursor = 0;

    while (cursor < input.length) {
        let ch = input[cursor];

        if (/\s/.test(ch)) {
            cursor++;
            continue;
        }

        if (/[a-zA-Z]/.test(ch)) {
            let word = "";

            while (/[a-zA-Z0-9]/.test(ch)) {
                word += ch;
                ch = input[++cursor];
                if (cursor >= input.length) {
                    break;
                }
            }

            switch (word) {
                case 'idu':
                    tokens.push({
                        type: 'keyword',
                        value: word
                    });
                    break;
                case 'torsu':
                    cursor++;
                    let exp = '';
                    if(input[cursor] == "#"){
                        cursor++;
                        while(input[cursor] != '#'){
                            exp += input[cursor];
                            cursor++;
                        }
                        cursor++;
                    }
                    tokens.push({
                        type: 'keyword',
                        value: word,
                        expression : exp
                    });
                    break;
                case 'if' :                     
                    let condition = ''
                    if(input[cursor] === '['){
                        cursor++;  
                        while(input[cursor] !== ']'){                        
                            condition += input[cursor];
                            cursor++;
                        }                      
                    }            
                    cursor++;
                    let statement = '';
                    if(input[cursor] == ':'){
                        cursor++;
                        while(input[cursor] != ':'){
                            statement += input[cursor];
                            cursor++;
                        }
                    }
                    cursor++;
                    let statement_value = lexer(statement);
                    tokens.push({
                        type: 'keyword',
                        value: word,
                        condition : condition,
                        statement : statement_value
                    })
                    break;
                default:
                    tokens.push({
                        type: 'identifier',
                        value: word
                    });
                    break;
            }
            continue;
        }

        if (/[0-9]/.test(ch)) {
            let num = '';
            while (/[0-9\.]/.test(ch)) {
                num += ch;
                ch = input[++cursor];
            }

            tokens.push({
                type: 'number',
                value: num.includes('.') ? parseFloat(num) : parseInt(num)
            });

            continue;
        }

        if (/[\+\-\*\\\/=]/.test(ch)) {
            tokens.push({
                type: 'operator',
                value: ch
            });
            cursor++;
            continue;
        }
    }

    return tokens;
}

const parser = (tokens) => {
    const ast = {
        type: 'Program',
        body: []
    };

    const getNextToken = () => tokens.length > 0 ? tokens.shift() : undefined;

    while (tokens.length > 0) {
        let token = tokens.shift();

        if(token?.type === 'keyword' && token.value === 'if'){
            let newast = parser(token.statement)
            let declare = {
                type : 'Condition',
                condition : token.condition,
                statement : newast
            };
            ast.body.push(declare);
        }

        if (token?.type === 'keyword' && token.value === 'idu') {
            let declare = {
                type: 'Declaration',
                name: tokens.shift().value,
                value: null
            };

            if (tokens[0]?.type === 'operator' && tokens[0].value === '=') {
                tokens.shift();

                let exp = '';

                while (tokens.length > 0 && tokens[0].type !== 'keyword') {
                    exp += tokens.shift().value;
                }

                declare.value = exp.trim();
            }

            ast.body.push(declare);
        }

        if (token?.type === 'keyword' && token.value === 'torsu') {
            let Statement = token.expression
            let nexttoken = tokens.shift()
            if(nexttoken?.type === 'identifier'){
                ast.body.push({
                    type: 'Print',
                    Statement : Statement,
                    expression : nexttoken.value 
                });
            }
            else{
                ast.body.push({
                    type: 'Print',
                    Statement : Statement,
                    expression : ''
                });
                if(nexttoken){
                    tokens.unshift(nexttoken);
                }
            }
        }

    }

    return ast;
}

const codeGenerator = (node) => {
    switch (node.type) {
        case 'Program':
            return node.body.map(codeGenerator).join('\n');

        case 'Declaration':
            return `const ${node.name} = ${node.value};`

        case 'Print':
            if(node.Statement === undefined || node.Statement === ''){
                if(node.expression === undefined || node.expression == ''){
                    return ``;
                }
                return `console.log(${node.expression})`;
            }
            else if(node.expression === undefined || node.expression == ''){
                return `console.log("${node.Statement}")`;
            }

            return `console.log("${node.Statement}",${node.expression})`;
        case 'Condition' : 
            return `if(${node.condition}){` + codeGenerator(node.statement) + `}`;
        
    }
}

const executeCode = (code) => {
    try {
        let logs = [];
        let originalConsoleLog = console.log;

        console.log = (...args) => {
            logs.push(args.join(" "));
            originalConsoleLog(...args);
        };

        eval(code);

        console.log = originalConsoleLog;
        
        return logs.length ? logs.join("\n") : "Execution completed";
    } catch (error) {
        return `Error: ${error.message}`;
    }
};


const compiler = (input) => {
    const tokens = lexer(input);
    const ast = parser(tokens);
    const executableCode = codeGenerator(ast);
    return executableCode;
}


var inputCode = '';

document.getElementById('code-editor').addEventListener('input', function () {
    inputCode = this.value;
});

document.getElementById('submit').addEventListener('click', () => {
    const RunnerCode = compiler(inputCode);

    const result = executeCode(RunnerCode);
    
    document.getElementById('output').textContent = `${result}`;
});
