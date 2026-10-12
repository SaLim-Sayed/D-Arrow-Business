from pathlib import Path
import difflib

root = Path("/Users/salemsayed/Downloads/RMBWorkspace/BABSadad")
files = {
    "controllers/mobile/frmFetchBillDetailsController/frmFetchBillDetailsController.js": [
        ("  billerRowData: {},\n  billers: [],", "  billerRowData: {},\n  draft: null,\n  billers: [],"),
        ("          this.billerData = data.billerData;\n          this.billerRowData = data.billerRowData;\n          this.billers = data.billers;\n          this.navigateFrom = data.navigateFrom;\n          this.setUI();", "          const nextBillerId = data.billerRowData && data.billerRowData.billerId;\n          const previousDraft = this.draft;\n          this.billerData = data.billerData;\n          this.billerRowData = data.billerRowData;\n          this.billers = data.billers;\n          this.navigateFrom = data.navigateFrom;\n          if(data.draft){\n            this.draft = data.draft;\n          }else if(previousDraft && previousDraft.billerId === nextBillerId){\n            this.draft = previousDraft;\n          }else{\n            this.draft = {\n              billerId: nextBillerId,\n              shortName: (this.billerRowData && this.billerRowData.billDescription) || \"\",\n              billAccountNumber: (this.billerRowData && this.billerRowData.billAccountNumber) || \"\",\n              billType: (this.billerRowData && this.billerRowData.billType) || \"\"\n            };\n          }\n          this.setUI();"),
        ("      this.view.lblCounter.text=\"0/35\";\n", ""),
        ("      this.view.txtBoxBillAccNum.setTextBoxData(txtBoxBillAccountNumObj);\n      this.view.lblTitle.text", "      this.view.txtBoxBillAccNum.setTextBoxData(txtBoxBillAccountNumObj);\n      this.draft = this.draft || {};\n      this.view.txtBoxShortName.setText(this.draft.shortName || \"\");\n      this.view.txtBoxBillAccNum.setText(this.draft.billAccountNumber || \"\");\n      this.view.lblCounter.text = (this.draft.shortName || \"\").length + \"/35\";\n      this.view.lblTitle.text"),
        ("      this.billType = \"\";\n      this.showBillType();\n      this.view.flxTooltipContainer.isVisible = false;", "      this.billType = \"\";\n      this.showBillType();\n      if(this.draft.billType){\n        this.selectBillType({id: this.draft.billType === BABConstants.sadad.prePaid ? \"flxPrePaid\" : \"flxPostPaid\"});\n      }else{\n        this.validateAllFields();\n      }\n      this.view.flxTooltipContainer.isVisible = false;"),
        ("      var billNo = this.view.lblBillNo.text;\n\n      this.billerRowData.billerName", "      var billNo = this.view.lblBillNo.text;\n      this.saveFormDraft();\n\n      this.billerRowData.billerName"),
        ("        dueDate: \"\",\n        navigateFrom: this.navigateFrom", "        dueDate: \"\",\n        billerData: this.billerData,\n        billMode: this.billMode,\n        billers: this.billers,\n        draft: this.draft,\n        navigateFrom: this.navigateFrom"),
        ("      kony.print(\"Inside fetchBillDetails\");\n      var billAccNum", "      kony.print(\"Inside fetchBillDetails\");\n      this.saveFormDraft();\n      var billAccNum"),
        ("      kony.print(\"In validateAllFields\");\n      let shortName", "      kony.print(\"In validateAllFields\");\n      this.saveFormDraft();\n      let shortName"),
        ("  validateAccountNumber: function(){", "  saveFormDraft: function(){\n    try{\n      if(!this.view || !this.view.txtBoxShortName || !this.view.txtBoxBillAccNum){return;}\n      this.draft = {\n        billerId: (this.billerRowData && this.billerRowData.billerId) || (this.draft && this.draft.billerId) || \"\",\n        shortName: this.view.txtBoxShortName.getText() || \"\",\n        billAccountNumber: this.view.txtBoxBillAccNum.getText() || \"\",\n        billType: this.billType || \"\"\n      };\n    }catch(ex){\n      kony.print(\"saveFormDraft exception ::\"+JSON.stringify(ex));\n      commonHelperObject.logCustomError(\"frmFetchBillDetailsController.js\", \"saveFormDraft\", ex);\n    }\n  },\n\n  validateAccountNumber: function(){"),
    ],
    "controllers/mobile/frmSadadAddBillReviewController/frmSadadAddBillReviewController.js": [
        ("    billerRowData: {},\n    flowType: \"\",", "    billerRowData: {},\n    billerData: {},\n    billers: [],\n    billMode: \"\",\n    flowType: \"\",\n    draft: null,"),
        ("          this.flowType = navData.flowType;\n          this.navigateFrom = navData.navigateFrom;", "          this.flowType = navData.flowType;\n          this.navigateFrom = navData.navigateFrom;\n          this.billerData = navData.billerData || {};\n          this.billers = navData.billers || [];\n          this.billMode = navData.billMode || \"\";\n          this.draft = navData.draft || null;"),
        ("        if(this.flowType === BABConstants.sadadAggregator.flowType){\n          navigationManager(\"frmSadadAggreAddNewBill\", null);\n        }\n        else{\n          navigationManager(\"frmFetchBillDetails\", null);\n        }", "        const draft = this.draft || {\n          shortName: this.billerRowData.billDescription || \"\",\n          billAccountNumber: this.billerRowData.billAccountNumber || \"\",\n          billType: this.billerRowData.billType || \"\"\n        };\n        if(this.flowType === BABConstants.sadadAggregator.flowType){\n          navigationManager(\"frmSadadAggreAddNewBill\", {\n            billMode: this.billerRowData.billMode,\n            billerData: this.billerRowData,\n            draft: draft\n          });\n        }\n        else{\n          navigationManager(\"frmFetchBillDetails\", {\n            billMode: this.billMode || this.billerRowData.billMode,\n            billerData: this.billerData,\n            billerRowData: this.billerRowData,\n            billers: this.billers,\n            navigateFrom: this.navigateFrom,\n            draft: draft\n          });\n        }")
    ]
}

patch_parts = []
for relative, replacements in files.items():
    old = (root / relative).read_text()
    new = old
    for before, after in replacements:
        if before not in new:
            raise SystemExit(f"Could not find expected text in {relative}: {before[:90]!r}")
        new = new.replace(before, after, 1)
    diff = difflib.unified_diff(old.splitlines(True), new.splitlines(True),
                                fromfile="a/" + relative, tofile="b/" + relative)
    patch_parts.extend(diff)

Path("/Users/salemsayed/1-Work/FREE/DArrow/D-Arrow-Business/tmp/rmb-form-draft-fix.patch").write_text("".join(patch_parts))
print("generated patch for", len(files), "controllers")
