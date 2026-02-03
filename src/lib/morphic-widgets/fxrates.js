// FXRatesMorph - CNB Exchange Rates Viewer
// Inherits from BoxMorph

function FXRatesMorph() {
  this.init();
}

FXRatesMorph.prototype = new BoxMorph();
FXRatesMorph.prototype.constructor = FXRatesMorph;
FXRatesMorph.uber = BoxMorph.prototype;

FXRatesMorph.prototype.init = function () {
  FXRatesMorph.uber.init.call(this);
  this.setExtent(new Point(550, 600));
  this.setColor(new Color(240, 240, 240));
  this.isDraggable = true;
  this.isResizable = true;
  this.minExtent = new Point(450, 300);

  // Header
  var title = new StringMorph("Kurzy ČNB", 20, "sans-serif", true);
  title.setPosition(this.position().add(new Point(10, 10)));
  this.add(title);

  // Date Input
  var rowY = 55;
  var dateLabel = new StringMorph("Datum:", 14, "sans-serif", true);
  // Center label vertically relative to button (height 26)
  // Label height approx 14. 26-14 = 12. 12/2 = 6.
  dateLabel.setPosition(this.position().add(new Point(15, rowY + 6)));
  this.add(dateLabel);

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();
  var dateStr = dd + "." + mm + "." + yyyy;

  // StringFieldMorph(text, minWidth, fontSize)
  this.dateField = new StringFieldMorph(dateStr, 130, 18);
  // Input height approx 18 (font size). Button height 26.
  // 26 - 18 = 8. 8/2 = 4.
  this.dateField.setPosition(this.position().add(new Point(80, rowY + 4)));
  this.add(this.dateField);

  // Load Button
  this.loadBtn = new BoxMorph();
  this.loadBtn.setExtent(new Point(110, 26));
  var normalColor = new Color(0, 120, 255);
  var hoverColor = new Color(50, 150, 255);
  var pressColor = new Color(0, 80, 200);
  this.loadBtn.setColor(normalColor);
  this.loadBtn.setPosition(this.position().add(new Point(220, rowY)));

  var btnLabel = new StringMorph("Načti kurzy", 13, "sans-serif", true);
  btnLabel.color = new Color(255, 255, 255);
  // Center label in button. Button 110x26. Label approx 80x13.
  // x: (110-80)/2 = 15. y: (26-13)/2 = 6.5 -> 6
  btnLabel.setPosition(this.loadBtn.position().add(new Point(12, 6)));
  this.loadBtn.add(btnLabel);

  // Button Interaction
  this.loadBtn.mouseEnter = function () {
    this.setColor(hoverColor);
  };
  this.loadBtn.mouseLeave = function () {
    this.setColor(normalColor);
  };
  this.loadBtn.mouseDownLeft = function (pos) {
    this.setColor(pressColor);
    return true;
  };
  this.loadBtn.mouseUpLeft = function (pos) {
    this.setColor(hoverColor);
    Morph.prototype.mouseUpLeft.call(this, pos);
  };

  this.loadBtn.mouseClickLeft = function () {
    // Fix for cloning: find the parent FXRatesMorph dynamically
    var owner = this.parent;
    while (owner && !(owner instanceof FXRatesMorph)) {
      owner = owner.parent;
    }
    if (owner) {
      owner.fetchRates();
    }
  };
  this.add(this.loadBtn);

  // Filter Input
  var filterLabel = new StringMorph("Filtr:", 14, "sans-serif", true);
  filterLabel.setPosition(this.position().add(new Point(340, rowY + 6)));
  this.add(filterLabel);

  this.filterField = new StringFieldMorph("", 80, 18);
  this.filterField.setPosition(this.position().add(new Point(380, rowY + 4)));
  this.add(this.filterField);

  // Info Label (Date and List Number)
  this.infoLabel = new StringMorph("", 12, "sans-serif", true);
  this.infoLabel.setPosition(this.position().add(new Point(10, 80)));
  this.add(this.infoLabel);

  // Table Container (ScrollFrame)
  this.tableContent = new BoxMorph();
  this.tableContent.setColor(new Color(255, 255, 255));
  this.tableContent.border = 0;

  // Add adjustBounds method to tableContent as ScrollFrame expects it
  this.tableContent.adjustBounds = function () {
    if (this.parent && this.parent instanceof ScrollFrameMorph) {
      this.parent.adjustScrollBars();
    }
  };

  var frameWidth = this.width() - 20;
  var frameHeight = this.height() - 115; // Adjusted for info label

  // ScrollFrameMorph(scroller, scrollBarSize, sliderColor)
  // We should not pass extent as 2nd argument!
  this.scrollFrame = new ScrollFrameMorph(this.tableContent);
  this.scrollFrame.setExtent(new Point(frameWidth, frameHeight));
  this.scrollFrame.setPosition(this.position().add(new Point(10, 105)));
  this.scrollFrame.setColor(new Color(200, 200, 200));
  this.add(this.scrollFrame);
  this.scrollFrame.hide();

  // Error Label
  this.errorLabel = new StringMorph("Chyba", 12, "sans-serif", false, false);
  this.errorLabel.setColor(new Color(200, 0, 0));
  this.errorLabel.setPosition(this.position().add(new Point(20, 130)));
  this.errorLabel.hide();
  this.add(this.errorLabel);
};

FXRatesMorph.prototype.setExtent = function (aPoint) {
  var newPoint = aPoint.max(this.minExtent || new Point(0, 0));
  FXRatesMorph.uber.setExtent.call(this, newPoint);

  if (this.scrollFrame) {
    var newWidth = this.width() - 20;
    var newHeight = this.height() - 115;

    this.scrollFrame.setExtent(new Point(newWidth, newHeight));
    this.scrollFrame.setPosition(this.position().add(new Point(10, 105)));

    if (this.tableContent) {
      var scrollBarSize = this.scrollFrame.scrollBarSize || 12;
      var minContentWidth = 510; // Sum of column widths
      var contentWidth = Math.max(minContentWidth, newWidth - scrollBarSize);
      this.tableContent.setExtent(
        new Point(
          contentWidth,
          Math.max(this.tableContent.height(), newHeight),
        ),
      );
    }

    if (this.scrollFrame.adjustContents) {
      this.scrollFrame.adjustContents();
    }
  }
};

FXRatesMorph.prototype.fetchRates = function () {
  var date = this.dateField.string();
  var targetUrl =
    "https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt?date=" +
    date;

  // Use a different CORS proxy (CodeTabs) as AllOrigins seems unstable or blocked
  var url =
    "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(targetUrl);
  var myself = this;

  fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.text();
    })
    .then(function (data) {
      myself.parseAndRender(data);
    })
    .catch(function (err) {
      console.error(err);
      myself.renderError("Chyba při načítání dat.\n" + err.message);
    });
};

FXRatesMorph.prototype.parseAndRender = function (text) {
  var lines = text.split("\n");
  var data = [];

  // Extract info from first line
  if (lines.length > 0) {
    var info = lines[0].trim();
    if (this.infoLabel) {
      this.infoLabel.text = info;
      this.infoLabel.fixLayout();
      this.infoLabel.changed();
    }
  }

  // Skip first 2 lines
  for (var i = 2; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line) {
      var parts = line.split("|");
      if (parts.length >= 5) {
        data.push({
          country: parts[0],
          currency: parts[1],
          amount: parts[2],
          code: parts[3],
          rate: parts[4],
        });
      }
    }
  }
  this.rawData = data;
  this.applyFilter();
};

FXRatesMorph.prototype.renderTable = function (data) {
  this.scrollFrame.show();
  if (this.errorLabel) this.errorLabel.hide();

  // Clear content
  this.tableContent.children.forEach(function (c) {
    c.destroy();
  });
  this.tableContent.children = [];

  var y = 0;
  var rowHeight = 20;

  var scrollBarSize = this.scrollFrame ? this.scrollFrame.scrollBarSize : 12;
  var frameWidth = this.scrollFrame ? this.scrollFrame.width() : 380;
  var minContentWidth = 510; // Sum of colWidths
  var contentWidth = Math.max(minContentWidth, frameWidth - scrollBarSize);

  // Adjusted columns: Code first, wider columns
  var colWidths = [60, 150, 120, 80, 100];
  var headers = ["Kód", "Země", "Měna", "Množství", "Kurz"];

  // Render Header
  var headerRow = new BoxMorph();
  headerRow.edge = 0;
  headerRow.border = 0;
  headerRow.setExtent(new Point(contentWidth, rowHeight));
  headerRow.setColor(new Color(220, 220, 220));
  headerRow.setPosition(this.tableContent.position().add(new Point(0, y)));

  var x = 0;
  headers.forEach(function (h, idx) {
    var label = new StringMorph(h, 12, "sans-serif", true);
    // Right align header for 'Kurz' as well? Maybe keep left for header, or match content.
    // Let's keep headers left aligned for simplicity, or try to match.
    var xPos = x + 5;
    if (idx === 3 || idx === 4) {
      // Množství and Kurz right aligned
      xPos = x + colWidths[idx] - label.width() - 10;
    }
    label.setPosition(headerRow.position().add(new Point(xPos, 2)));
    headerRow.add(label);
    x += colWidths[idx];
  });
  this.tableContent.add(headerRow);
  y += rowHeight;

  // Render Rows
  var myself = this;
  data.forEach(function (row, i) {
    var rowMorph = new BoxMorph();
    rowMorph.edge = 0;
    rowMorph.border = 0;
    rowMorph.setExtent(new Point(contentWidth, rowHeight));
    rowMorph.setColor(
      i % 2 === 0 ? new Color(255, 255, 255) : new Color(245, 245, 245),
    );
    rowMorph.setPosition(myself.tableContent.position().add(new Point(0, y)));

    // New order: Code, Country, Currency, Amount, Rate
    var vals = [row.code, row.country, row.currency, row.amount, row.rate];
    var rx = 0;
    vals.forEach(function (v, idx) {
      var label = new StringMorph(v, 12);
      var xPos = rx + 5;

      if (idx === 3 || idx === 4) {
        // Množství and Kurz - Right align
        xPos = rx + colWidths[idx] - label.width() - 10;
      }

      label.setPosition(rowMorph.position().add(new Point(xPos, 2)));
      rowMorph.add(label);
      rx += colWidths[idx];
    });

    myself.tableContent.add(rowMorph);
    y += rowHeight;
  });

  // Resize content to fit
  var minHeight = this.scrollFrame ? this.scrollFrame.height() : 400;
  this.tableContent.setExtent(new Point(contentWidth, Math.max(y, minHeight)));

  // Force scrollframe update if needed
  if (this.scrollFrame.adjustContents) {
    this.scrollFrame.adjustContents();
  }
};

FXRatesMorph.prototype.applyFilter = function () {
  if (!this.rawData) return;

  var filterText = this.filterField.string().toUpperCase();
  var filteredData = this.rawData;

  if (filterText.length > 0) {
    filteredData = this.rawData.filter(function (row) {
      return row.code.toUpperCase().includes(filterText);
    });
  }

  this.renderTable(filteredData);
};

FXRatesMorph.prototype.step = function () {
  // Check for filter changes
  var currentFilter = this.filterField.string();
  if (this.lastFilterValue !== currentFilter) {
    this.lastFilterValue = currentFilter;
    this.applyFilter();
  }
};

FXRatesMorph.prototype.renderError = function (msg) {
  this.scrollFrame.hide();
  if (this.errorLabel) {
    this.errorLabel.text = msg;
    this.errorLabel.show();
    this.errorLabel.changed();
  }
};

// Focus handling
FXRatesMorph.prototype.mouseDownLeft = function (pos) {
  if (this.world()) {
    // Bring to front
    if (this.parent) {
      this.fullChanged();
      this.parent.add(this);
      this.fullChanged();
    }
  }
  // BoxMorph/Morph usually doesn't have mouseDownLeft, so we don't call uber
};

FXRatesMorph.prototype.userMenu = function () {
  var menu = new MenuMorph(this, "Kurzy");
  menu.addItem("zavřít", "destroy");
  return menu;
};

FXRatesMorph.prototype.toString = function () {
  return "FX Rates";
};
