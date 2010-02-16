function testDeclaration() {
    assertEquals(eval("var test = 1; test;"), compileAndRun('var test = 1; test;')); 
}

function testMultipleDeclaration() {
    var testcode = 'var test = 1, test2 = 5 + test; test2;';
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testDeclareNoAssignment() {
    var testcode = "var a,b,c,d,e,f,g,x,y,z;10;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testCommasNoAssignment() {
    var testcode = "var x = 10, y = 20, z = 20; x,y,z;"
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testAssignment() {
    var testcode = "x = 10; x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
    
    testcode = "x = 10, y = 20; x + y;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
}

function testDeclareThenAssign() {
    var testcode = "var x,y,z; x = 20, y = 80, z = 0; x + y + z;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}   

function testVariableMaths() {
    var testcode = "var x = 1, y = 94; var z = x + y; z;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testVariableStrings() {
    var testcode = "var pre = 'Thee ', ten = 'Silver Mt. Zion ', tious = 'Memorial Orchestra'; pre + ten + tious;";
    assertEquals(eval(testcode), compileAndRun(testcode));    
}

function testReservedNamePrevention() {
    var compiled;
    try {
        self.compile("var var = 10; var;");
        compiled = true;
    } catch(e) {        
        compiled = (e.name.match(/Error/i)) ? false : true;
    }
    assert(!compiled);
}