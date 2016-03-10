/// <reference path="../typings/main.d.ts" />
/// <reference path="../typings/custom.d.ts" />

import {DataTable} from "./DataTable";
import {Guid} from "./Guid";
import {Fetch} from "./Fetch";

import path = require("path");
import edge = require("edge");

export class CRMClient {

  private crmBridge:any;

  constructor(private connectionString?: string, version?:string) {

    var versions = ["2011","2015"];

    if(version===undefined){
      // The default version is the last one
      version = versions[versions.length-1];
    }

    if (versions.indexOf(version)==-1) throw `Version ${version} not supported`;

    if(connectionString===undefined) connectionString="default";
    var config = this.tryGetModule(path.join(process.cwd(),"config.json"));
    if(config&&config.connectionStrings&&config.connectionStrings[connectionString]){
      this.connectionString=config.connectionStrings[connectionString];
    }

    if(!this.connectionString) throw "Connection String not specified";

    var source = path.join(__dirname,"CRMBridge.cs");
    var ref1 = path.join(__dirname,`bin/${version}/Microsoft.Crm.Sdk.Proxy.dll`);
    var ref2 = path.join(__dirname,`bin/${version}/Microsoft.Xrm.Client.dll`);
    var ref3 = path.join(__dirname,`bin/${version}/Microsoft.Xrm.Sdk.dll`);
    var ref4 = path.join("System.Runtime.Serialization.dll");

    var createBridge = edge.func({
      source: source,
      references: [ ref1, ref2, ref3, ref4 ]
    });

    this.crmBridge = createBridge(this.connectionString,true);
  }

  private tryGetModule(moduleId: string) {
    var result = null;
    try {
      result = require(moduleId);
    } catch (e) { }

    return result;
  }

  private convert(propertiesArray:Array<any>){
    var converted:any=null;
    if (propertiesArray){
        converted={};
        for(var i=0;i<propertiesArray.length;i++)
        {
          var propValue = propertiesArray[i];
          converted[propValue[0]]=propValue[1];
        }
    }
    return converted;
  }

  whoAmI(){
    return this.crmBridge.WhoAmI(null,true);
  }

  retrieve(entityName: string, idOrConditions: string|Guid|Object, columns?: string|string[]|boolean) {
    var idValue:string;
    var result:any;

    if(idOrConditions instanceof Guid) {
      idValue=idOrConditions.getValue();
    }
    else if (typeof idOrConditions === "string" || idOrConditions instanceof String){
      idValue = <string>idOrConditions;
    }
    else if (typeof idOrConditions === "object") {
      // Assume a conditions objet was passed
      // Get the records that meet the specified criteria
      // The id field of an entity is always the entity name + "id"
      // TODO: Except for activities
      var idField:string = `${entityName}id`.toLowerCase();
      var foundRecords = this.retrieveMultiple(entityName,idOrConditions,idField);
      if(foundRecords.rows!==null){
        if (foundRecords.rows.length>1) throw new Error("Too many records found matching the specified criteria");
        if(foundRecords.rows.length>0){
          idValue = foundRecords.rows[0][idField];
        }
      }
    }
    else{
      throw new Error("invalid idOrConditions type value");
    }

    if(idValue){
      var params:any = {entityName:entityName,id:idValue,columns:true};
      if(columns!==undefined) {
        if(typeof columns == "string")
        {
          params.columns = [columns];
        }
        else
        {
          params.columns = columns;
        }
      }
      var retrieveResult;
      try{
        retrieveResult = this.crmBridge.Retrieve(params,true);
      }
      catch (ex){
        var rethrow = false;
        if(ex.Detail&&ex.Detail.InnerFault&&ex.Detail.InnerFault.Message){
          // Record with specified Id doesn't exists
          var msg = `${entityName} With Id = ${idValue.toLowerCase().replace("{","").replace("}","")} Does Not Exist`;
          if(ex.Detail.InnerFault.Message!=msg) rethrow = true;
        }
        if(rethrow) throw ex;
      }
      // convert the result to a js object
      if(retrieveResult!=null){
        result = this.convert(retrieveResult);
      }
    }
    return result;
  }

  retrieveMultiple(fetchXml: string): DataTable;
  retrieveMultiple(entityName: string, conditions?, attributes?:boolean|string|string[]): DataTable;
  retrieveMultiple(entityName: string, conditions?, attributes?:boolean|string|string[]): DataTable {
    var result = new Array<any>();

    var fetchXml=entityName;
    if(conditions!=undefined){
      var fetch = new Fetch(entityName);
      fetch.setFilter(conditions);
      if(attributes!=undefined){
        fetch.setAttributes(attributes);
      }
      fetchXml = fetch.toString();
    }

    var retrieveResult = this.crmBridge.RetrieveMultiple(fetchXml,true);

    for (let i = 0; i < retrieveResult.length; i++) {
        var record = retrieveResult[i];
        var convertedRecod = this.convert(record);
        result.push(convertedRecod);
    }

    var dt = new DataTable(result);
    return dt;
  }

  retrieveAll(entityName: string): DataTable {
    var fetch = new Fetch(entityName,"*");
    var fetchXml = fetch.toString();
    var result = this.retrieveMultiple(fetchXml);
    return result;
  }

  create(entityName: string, attributes: any): string {
    var values = new Array<any>();

    for(var prop in attributes){
      values.push(prop);
      values.push(attributes[prop]);
    }

    var params = {entityName:entityName,values:values};
    var createdGuid = this.crmBridge.Create(params,true);
    return createdGuid;
  }

  delete(entityName: string, idsOrConditions):number{
    var ids:string[];
    var recordsAffected = 0;

    if(idsOrConditions instanceof Guid) {
      ids=[idsOrConditions.getValue()];
    }
    else if (typeof idsOrConditions == "string") {
      ids = [idsOrConditions];
    }
    else if (Array.isArray(ids)){
      // TODO: check the value type of each item
      ids = idsOrConditions;
    }
    else if (typeof idsOrConditions == "object" && !(idsOrConditions instanceof Date)) {
      // Get the records that meet the specified criteria
      // The id field of an entity is always the entity name + "id"
      // TODO: Except for activities
      var idField:string = `${entityName}id`.toLowerCase();
      var foundRecords = this.retrieveMultiple(entityName,idsOrConditions,idField);
      ids = [];
      for(var i=0;i<foundRecords.rows.length;i++){
        ids.push(foundRecords.rows[i][idField]);
      }
    }

    recordsAffected = this.deleteMultiple(entityName,ids);
    return recordsAffected;
  }

  private deleteMultiple(entityName: string, ids: string[]):number{
    var recordsAffected = 0;

    for(var i=0;i<ids.length;i++){
      var params:any = {entityName:entityName,id:ids[i]};
      this.crmBridge.Delete(params,true);
      recordsAffected++;
    }
    return recordsAffected;
  }

  update(entityName: string, attributes: any, conditions?): number {

    var updatedRecordsCount=0;
    var values = new Array<any>();

    // prepare values
    for(var prop in attributes){
      var attrName = prop.toLowerCase();
      values.push(attrName);
      values.push(attributes[prop]);
    }

    // get records GUIDS
    if(conditions!=undefined){
      // The id field of an entity is always the entity name + "id"
      // TODO: Except for activities
      var idField:string = `${entityName}id`.toLowerCase();
      var foundRecords = this.retrieveMultiple(entityName,conditions,idField);
      var idFieldIndex = values.indexOf(idField);
      if(idFieldIndex<0) {
          // Add the id field to the values array and save the attribute index
          idFieldIndex = values.push(idField) - 1;
          values.push(null);
      }
      for(var i=0;i<foundRecords.rows.length;i++){
        var foundRecordId=foundRecords.rows[i][idField];
        values[idFieldIndex+1]=foundRecordId;
        var params:any = {entityName:entityName,values:values};
        this.crmBridge.Update(params,true);
      }
      updatedRecordsCount=foundRecords.rows.length;
    }
    else {
      // the attributes parameter must contain the entity id on it
      var params:any = {entityName:entityName,values:values};
      this.crmBridge.Update(params,true);
      updatedRecordsCount=1;
    }

    return updatedRecordsCount;
  }
  
    getIdField(entityName:string):string{
        // TODO: Improve this
        return entityName+"id";
    }
  
    createOrUpdate(entityName: string, attributes, matchFields:string[]): void {
        var idField = this.getIdField(entityName);
        var conditions={};
        for (var i = 0; i < matchFields.length; i++) {
            var matchField = matchFields[i];
            if(attributes[matchField]!==undefined&&attributes[matchField]!==null){
                conditions[matchField]=attributes[matchField];
            }
        }

        // check if the record exists
        var foundRecord = this.retrieve(entityName,conditions,idField);
        if(foundRecord){
            // The record exists. Update it
            attributes[idField]=foundRecord[idField];
            this.update(entityName,attributes);
        }
        else{
            // The record doesn't exists. Create it
            this.create(entityName,attributes);
        }
    }
}