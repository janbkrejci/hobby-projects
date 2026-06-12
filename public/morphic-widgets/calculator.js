// CalculatorMorph - A scientific calculator built with Morphic.js
// Inherits from BoxMorph

function CalculatorMorph() {
  this.init();
}

CalculatorMorph.prototype = new BoxMorph();
CalculatorMorph.prototype.constructor = CalculatorMorph;
CalculatorMorph.uber = BoxMorph.prototype;

CalculatorMorph.prototype.init = function () {
  // Call parent constructor
  CalculatorMorph.uber.init.call(this);

  // Set calculator dimensions and appearance
  this.setExtent(new Point(215, 395));
  this.setColor(new Color(50, 50, 50));
  this.isDraggable = true; // Make calculator draggable

  // Calculator state
  this.currentInput = "0";
  this.previousInput = "";
  this.operation = null;
  this.shouldResetDisplay = false;
  this.memory = 0;
  this.expression = "";
  this.openParenCount = 0;
  this.hasFocus = false;

  // Constants
  this.MAX_DISPLAY_WIDTH = 175;

  // Build UI
  this.buildDisplay();
  this.buildButtons();

  // Initialize display
  this.updateDisplay("0");
};

CalculatorMorph.prototype.buildDisplay = function () {
  // Display background - taller for two rows
  this.displayBg = new BoxMorph();
  this.displayBg.setExtent(new Point(195, 70));
  this.displayBg.setPosition(this.position().add(new Point(10, 10)));
  this.displayBg.setColor(new Color(230, 230, 230));
  this.displayBg.border = 0;
  this.displayBg.borderColor = new Color(0, 120, 255); // Blue border for focus
  this.add(this.displayBg);

  // Expression display (top row - smaller)
  this.expressionLabel = new StringMorph("", 14);
  this.expressionLabel.color = new Color(100, 100, 100);
  this.expressionLabel.fixLayout();
  this.expressionLabel.setPosition(
    this.displayBg.position().add(new Point(5, 5)),
  );
  this.displayBg.add(this.expressionLabel);

  // Main number display (bottom row)
  this.displayLabel = new StringMorph("0", 24);
  this.displayLabel.color = new Color(0, 0, 0);
  this.displayLabel.fixLayout();
  this.displayBg.add(this.displayLabel);

  // Memory indicator
  this.memoryIndicator = new StringMorph("M", 12);
  this.memoryIndicator.color = new Color(100, 100, 100);
  this.memoryIndicator.fixLayout();
  this.memoryIndicator.setPosition(
    this.displayBg.position().add(new Point(5, 50)),
  );
  this.memoryIndicator.hide();
  this.displayBg.add(this.memoryIndicator);
};

CalculatorMorph.prototype.buildButtons = function () {
  var buttons = [
    ["MC", "MR", "M-", "M+"],
    ["(", ")", "C", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["±", "0", ",", "="],
  ];

  var btnSize = 45;
  var gap = 5;
  var startX = 10;
  var startY = 90;

  for (var r = 0; r < buttons.length; r++) {
    for (var c = 0; c < buttons[r].length; c++) {
      var label = buttons[r][c];
      this.createButton(
        label,
        btnSize,
        startX + c * (btnSize + gap),
        startY + r * (btnSize + gap),
      );
    }
  }
};

CalculatorMorph.prototype.createButton = function (label, size, x, y) {
  var btn = new BoxMorph();
  btn.setExtent(new Point(size, size));
  btn.setPosition(this.position().add(new Point(x, y)));

  // Color styling
  if (["+", "-", "*", "/", "="].includes(label)) {
    btn.setColor(new Color(255, 165, 0)); // Orange
  } else if (["C", "MC"].includes(label)) {
    btn.setColor(new Color(200, 50, 50)); // Red
  } else if (["M+", "M-", "MR", "±", "(", ")"].includes(label)) {
    btn.setColor(new Color(80, 120, 180)); // Blue
  } else if (label === ",") {
    btn.setColor(new Color(100, 140, 100)); // Green
  } else {
    btn.setColor(new Color(100, 100, 100)); // Gray
  }

  var fontSize = label.length > 2 ? 16 : 20;
  var btnLabel = new StringMorph(label, fontSize);
  btnLabel.color = new Color(255, 255, 255);
  btnLabel.fixLayout();

  var labelX = btn.position().x + (size - btnLabel.width()) / 2;
  var labelY = btn.position().y + (size - btnLabel.height()) / 2;
  btnLabel.setPosition(new Point(labelX, labelY));
  btn.add(btnLabel);

  // Click event
  btn.mouseClickLeft = function () {
    this.parent.handleInput(label);
    this.setColor(this.color.lighter());
    var button = this;
    setTimeout(function () {
      button.setColor(button.color.darker());
    }, 100);
  };

  this.add(btn);
};

// Number formatting
CalculatorMorph.prototype.formatNumber = function (num) {
  var str = num.toString();

  if (str.includes("e")) {
    var parts = str.split("e");
    var mantissa = parseFloat(parts[0]).toFixed(2);
    return mantissa.replace(".", ",") + "e" + parts[1];
  }

  var parts = str.split(".");
  var intPart = parts[0];
  var decPart = parts[1];

  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart ? intPart + "," + decPart : intPart;
};

CalculatorMorph.prototype.fitNumberToDisplay = function (num) {
  var numVal = parseFloat(num);

  if (isNaN(numVal)) return "0";
  if (!isFinite(numVal)) return "Error";

  var str = num.toString();

  this.displayLabel.text = this.formatNumber(str);
  this.displayLabel.fixLayout();

  if (this.displayLabel.width() <= this.MAX_DISPLAY_WIDTH) {
    return str;
  }

  if (str.includes(".")) {
    for (var decimals = 10; decimals >= 0; decimals--) {
      var rounded = numVal.toFixed(decimals);
      this.displayLabel.text = this.formatNumber(rounded);
      this.displayLabel.fixLayout();
      if (this.displayLabel.width() <= this.MAX_DISPLAY_WIDTH) {
        return rounded;
      }
    }
  }

  return numVal.toExponential(2);
};

CalculatorMorph.prototype.formatExpression = function (expr) {
  return expr.replace(/\*/g, "×").replace(/\//g, "÷").replace(/\./g, ",");
};

CalculatorMorph.prototype.updateMemoryIndicator = function () {
  if (this.memory !== 0) {
    this.memoryIndicator.show();
  } else {
    this.memoryIndicator.hide();
  }
  this.memoryIndicator.changed();
  this.displayBg.changed();
};

CalculatorMorph.prototype.updateExpressionDisplay = function () {
  var fullExpr = this.expression;
  // Append current input to expression display if it's being typed and not already part of expression
  if (
    !this.expression.endsWith("=") &&
    this.currentInput !== "" &&
    this.currentInput !== "Error"
  ) {
    // Don't show "0" if it's the only thing (clean state)
    if (this.expression === "" && this.currentInput === "0") {
      // do nothing
    } else {
      fullExpr += this.currentInput;
    }
  }

  var displayExpr = this.formatExpression(fullExpr);
  this.expressionLabel.text = displayExpr;
  this.expressionLabel.fixLayout();

  // Truncate from left if too long
  var maxW = 185;
  if (this.expressionLabel.width() > maxW) {
    var original = displayExpr;
    for (var i = 1; i < original.length; i++) {
      this.expressionLabel.text = "..." + original.substring(i);
      this.expressionLabel.fixLayout();
      if (this.expressionLabel.width() <= maxW) break;
    }
  }

  this.expressionLabel.changed();
};

CalculatorMorph.prototype.updateDisplay = function (text) {
  var displayText = text;

  if (!isNaN(text) && text !== "" && text !== "Error") {
    displayText = this.fitNumberToDisplay(text);
    displayText = this.formatNumber(displayText);
  }

  this.displayLabel.text = displayText;
  this.displayLabel.fixLayout();

  var displayY =
    this.displayBg.position().y + 70 - this.displayLabel.height() - 5;
  var displayX =
    this.displayBg.position().x + 195 - this.displayLabel.width() - 10;
  this.displayLabel.setPosition(new Point(displayX, displayY));
  this.displayLabel.changed();
  this.displayBg.changed();
  this.updateMemoryIndicator();
  // updateExpressionDisplay is called separately to avoid recursion or double updates
};

CalculatorMorph.prototype.handleInput = function (val) {
  // Backspace on Error
  if (val === "Backspace" && this.currentInput === "Error") {
    this.currentInput = "0";
    this.expression = "";
    this.shouldResetDisplay = false;
    this.updateDisplay("0");
    this.updateExpressionDisplay();
    return;
  }

  // Numbers
  if (val >= "0" && val <= "9") {
    if (this.shouldResetDisplay) {
      this.currentInput = val;
      this.shouldResetDisplay = false;
      if (this.expression.endsWith("=")) {
        this.expression = "";
      }
    } else {
      if (this.currentInput === "0") this.currentInput = val;
      else this.currentInput += val;
    }
    this.updateDisplay(this.currentInput);
    this.updateExpressionDisplay();
    return;
  }

  // Decimal separator
  if (val === ",") {
    if (this.shouldResetDisplay) {
      this.currentInput = "0.";
      this.shouldResetDisplay = false;
      if (this.expression.endsWith("=")) this.expression = "";
    } else if (!this.currentInput.includes(".")) {
      this.currentInput += ".";
    }
    this.updateDisplay(this.currentInput);
    this.updateExpressionDisplay();
    return;
  }

  // Backspace
  if (val === "Backspace") {
    if (!this.shouldResetDisplay) {
      if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
      } else {
        this.currentInput = "0";
      }
      this.updateDisplay(this.currentInput);
      this.updateExpressionDisplay();
    }
    return;
  }

  // Clear
  if (val === "C" || val === "Escape" || val === "c") {
    this.currentInput = "0";
    this.expression = "";
    this.shouldResetDisplay = false;
    this.updateDisplay("0");
    this.updateExpressionDisplay();
    return;
  }

  // Operators
  if (["+", "-", "*", "/"].includes(val)) {
    if (this.expression.endsWith("=")) {
      this.expression = this.currentInput + val;
    } else {
      if (this.currentInput !== "") {
        this.expression += this.currentInput;
      }

      var last = this.expression.slice(-1);
      if (["+", "-", "*", "/"].includes(last) && this.currentInput === "") {
        this.expression = this.expression.slice(0, -1) + val;
      } else {
        this.expression += val;
      }
    }
    this.currentInput = "";
    this.shouldResetDisplay = false;
    this.updateDisplay("0"); // Or keep previous number?
    this.updateExpressionDisplay();
    return;
  }

  // Equals
  if (val === "=" || val === "Enter") {
    if (this.expression.endsWith("=")) return;

    var fullExpr = this.expression;
    if (this.currentInput !== "") {
      fullExpr += this.currentInput;
    }

    // Auto-close parentheses
    var openParens = (fullExpr.match(/\(/g) || []).length;
    var closeParens = (fullExpr.match(/\)/g) || []).length;
    while (openParens > closeParens) {
      fullExpr += ")";
      closeParens++;
    }

    try {
      var res = eval(fullExpr);
      this.expression = fullExpr + "=";
      this.currentInput = res.toString();
      this.shouldResetDisplay = true;
    } catch (e) {
      this.currentInput = "Error";
      this.expression = "";
    }
    this.updateDisplay(this.currentInput);
    this.updateExpressionDisplay();
    return;
  }

  // Parentheses
  if (val === "(") {
    if (this.expression.endsWith("=")) {
      this.expression = "(";
    } else {
      // Implicit multiplication: 2( -> 2*(
      if (this.currentInput !== "" && this.currentInput !== "0") {
        this.expression += this.currentInput + "*(";
      } else {
        var last = this.expression.slice(-1);
        if (last === ")") {
          this.expression += "*(";
        } else {
          this.expression += "(";
        }
      }
    }
    this.currentInput = "";
    this.shouldResetDisplay = false;
    this.updateDisplay("0");
    this.updateExpressionDisplay();
    return;
  }

  if (val === ")") {
    if (!this.expression.endsWith("=")) {
      // Check for matching open parenthesis
      var openParens = (this.expression.match(/\(/g) || []).length;
      var closeParens = (this.expression.match(/\)/g) || []).length;

      if (openParens <= closeParens) {
        return;
      }

      if (this.currentInput !== "") {
        this.expression += this.currentInput;
      }
      this.expression += ")";
      this.currentInput = "";

      // Optional: Show intermediate result
      try {
        var res = eval(this.expression);
        this.updateDisplay(res.toString());
      } catch (e) {
        this.updateDisplay("0");
      }
    }
    this.updateExpressionDisplay();
    return;
  }

  // Memory and Sign
  if (val === "M+") {
    this.memory += parseFloat(this.currentInput);
    this.updateMemoryIndicator();
    this.shouldResetDisplay = true;
  } else if (val === "M-") {
    this.memory -= parseFloat(this.currentInput);
    this.updateMemoryIndicator();
    this.shouldResetDisplay = true;
  } else if (val === "MR") {
    this.currentInput = this.memory.toString();
    this.updateDisplay(this.currentInput);
    this.shouldResetDisplay = true;
    this.updateExpressionDisplay();
  } else if (val === "MC") {
    this.memory = 0;
    this.updateMemoryIndicator();
  } else if (val === "±") {
    if (this.currentInput !== "0") {
      if (this.currentInput.startsWith("-")) {
        this.currentInput = this.currentInput.substring(1);
      } else {
        this.currentInput = "-" + this.currentInput;
      }
      this.updateDisplay(this.currentInput);
      this.updateExpressionDisplay();
    }
  }
};

CalculatorMorph.prototype.calculate = function () {
  var prev = parseFloat(this.previousInput);
  var curr = parseFloat(this.currentInput);
  var result = 0;

  switch (this.operation) {
    case "+":
      result = prev + curr;
      break;
    case "-":
      result = prev - curr;
      break;
    case "*":
      result = prev * curr;
      break;
    case "/":
      if (curr === 0) {
        this.currentInput = "Error";
        this.updateDisplay("Error");
        this.previousInput = "";
        this.operation = null;
        return;
      }
      result = prev / curr;
      break;
  }

  this.currentInput = result.toString();
  this.updateDisplay(this.currentInput);
};

// Keyboard support
CalculatorMorph.prototype.processKeyPress = function (event) {
  var key = event.key;
  if (key === ".") key = ",";
  this.handleInput(key);
};

CalculatorMorph.prototype.processKeyDown = function (event) {
  if (event.key === "Escape") {
    this.handleInput("C");
  } else if (event.key === "Backspace") {
    this.handleInput("Backspace");
  }
};

// Mouse click handler to grab keyboard focus
CalculatorMorph.prototype.mouseClickLeft = function () {
  if (this.world()) {
    this.grabKeyboardFocus();
  }
};

// Handle mouse down to grab focus
CalculatorMorph.prototype.mouseDownLeft = function (pos) {
  if (this.world()) {
    this.grabKeyboardFocus();
    // Bring to front
    if (this.parent) {
      this.fullChanged();
      this.parent.add(this);
      this.fullChanged();
    }
  }
  // Pass event to super if needed, but BoxMorph doesn't have mouseDownLeft.
  // We don't need to do anything else here.
};

// Step method to check for focus changes
CalculatorMorph.prototype.step = function () {
  var hasFocus = this.world() && this.world().keyboardFocus === this;
  if (this.hasFocus !== hasFocus) {
    this.hasFocus = hasFocus;
    this.updateFocusIndicator();
  }
};

// Grab keyboard focus
CalculatorMorph.prototype.grabKeyboardFocus = function () {
  if (this.world()) {
    this.world().keyboardFocus = this;
    this.hasFocus = true;
    this.updateFocusIndicator();
    // Remove focus from other calculators
    this.world().children.forEach((child) => {
      if (child instanceof CalculatorMorph && child !== this) {
        child.hasFocus = false;
        child.updateFocusIndicator();
      }
    });
  }
};

// Update visual focus indicator
CalculatorMorph.prototype.updateFocusIndicator = function () {
  if (this.hasFocus) {
    this.displayBg.border = 3;
  } else {
    this.displayBg.border = 0;
  }
  this.displayBg.changed();
  this.displayBg.rerender();
};

// Called after calculator is dropped (e.g., from demo menu)
CalculatorMorph.prototype.justDropped = function () {
  if (this.world()) {
    this.grabKeyboardFocus();
  }
};

CalculatorMorph.prototype.toString = function () {
  return "calculator";
};

// Global override for WorldMorph to clear focus on background click
WorldMorph.prototype.mouseDownLeft = function (pos) {
  if (this.keyboardFocus) {
    this.keyboardFocus = null;
  }
};

WorldMorph.prototype.mouseDownRight = function (pos) {
  if (this.keyboardFocus) {
    this.keyboardFocus = null;
  }
};

CalculatorMorph.prototype.userMenu = function () {
  var menu = new MenuMorph(this, "Kalkulačka");
  menu.addItem("zavřít", "destroy");
  return menu;
};
