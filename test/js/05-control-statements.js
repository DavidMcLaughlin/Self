function testIfStatement() {
    var testcode = "var x; if(true) { x = 10; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
    
    testcode = "var x = 14; if((x >= 0 && x <= 10) || x === 14) { x = 1; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));   
}

function testIfElseStatement() {
    var testcode = "var x; if(false) { x = 5; } else { x = 10;} x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testIfElseIfElseStatement() {
    var testcode = "var x = true; if(x === true && false) { x = 10; } else if (x === false) { x = 20; } else { x = 50; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
    
    testcode = "var x = 50; if(x >= 1 && x <= 10) { x = 1; } else if(x >= 11 && x <= 20) { x = 2; } else if(x >= 21 && x <= 30) { x = 3; } else if(x >= 31 && x <= 40) { x = 4; } else if(x >= 41 && x <= 50) { x = 5; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
}

function testForStatement() {
    var testcode = "var x = 0; for(var i = 0, j = 5; i < j; i++) { x += i; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
    
    testcode = "var x = 0, y = 10; for(;;) { x += 1; if(x === y) { break; } } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
    
    testcode = "var x = 1,y=0; for(;x < 10; x*=2) { y++; } y;";
    assertEquals(eval(testcode), compileAndRun(testcode));       
    
    testcode = "var x=1; for(var i = 0;;i++) { if(i === 10) { x = i; break; } } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));     
    
    testcode = "var x=10; for(var i = 0;i < x;) { i++; x--; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));        
}

function testForInStatement() {
    var testcode = "var x = { prop1: true, prop2: false }, y; for(var prop in x) { y = x[prop]; }; y;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testDoStatement() {
    var testcode = "var x = 0; do { x+=1; } while(x <= 20); x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testWhileStatement() {
    var testcode = "var x = 0; while(x < 5) { x += 1; } x;";    
    assertEquals(eval(testcode), compileAndRun(testcode)); 

    testcode = "var x = 0; while(true) { x += 1; if(x === 10) { break; } } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testSwitchStatement() {
    var testcode = "var x = 'a', y = 'z'; switch(x) { case 'a': y = 'b'; break; default: y = 'y'; } y;";
    assertEquals(eval(testcode), compileAndRun(testcode));
    
    testcode = "var x = 10; switch(x) { case 10 === 20: case x < 5: case 10: x = 50; default: x = 0; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
}

function testTryStatement() {
    var testcode = "var x; try { 68++; x = 20; } catch(e) { x = 10; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
    
    testcode = "var x; try { 100++; } catch(e) { x = 10; } finally { x = 20; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
}

function testThrowStatement() {
    var testcode = "var x; try { throw 'exception thrown'; } catch(e) { x = e; } x;";
    assertEquals('exception thrown', compileAndRun(testcode));
}

function testLabelledStatement() {
    assert(false);
}

function testStatementAcid() {
    var testcode = "var x,y,z; x = y = z = 0; while(true) { for(var i = 0; i < 10; i++) { x++; if(i % 2 === 0) { y++; } else if(i % 3 === 0) { z++; } } if(x+y+z > 10) { break; } } x + y + z;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
}