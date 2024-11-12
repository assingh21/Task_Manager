import { LightningElement, track, wire } from 'lwc';
import getTasks from '@salesforce/apex/TaskManagerController.getTasks';
import createTask from '@salesforce/apex/TaskManagerController.createTask';
import updateTaskStatus from '@salesforce/apex/TaskManagerController.updateTaskStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TaskManager extends LightningElement {
    @track tasks = [];
    @track newTask = { Name: '', Description__c: '', Due_Date__c: '', Priority__c: 'Medium', Status__c: 'New' };
    @track priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];
    columns = [
        { label: 'Task Name', fieldName: 'Name' },
        { label: 'Description', fieldName: 'Description__c' },
        { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' },
        { label: 'Priority', fieldName: 'Priority__c' },
        { label: 'Status', fieldName: 'Status__c' },
        {
            type: 'button',
            typeAttributes: {
                label: 'Update Status',
                name: 'updateStatus',
                variant: 'brand'
            }
        }
    ];

    @wire(getTasks)
    wiredTasks({ error, data }) {
        if (data) {
            this.tasks = data;
        } else if (error) {
            this.showToast('Error', 'Error loading tasks', 'error');
        }
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.newTask[field] = event.target.value;
    }

    handleCreateTask() {
        const today = new Date().toISOString().split('T')[0];
        if (this.newTask.Due_Date__c < today) {
            this.showToast('Error', 'Due Date cannot be in the past', 'error');
            return;
        }
        createTask({ task: this.newTask })
            .then(() => {
                this.showToast('Success', 'Task created successfully', 'success');
                return refreshApex(this.wiredTasks);
            })
            .catch(error => {
                this.showToast('Error', 'Error creating task', 'error');
            });
    }

    handleRowAction(event) {
        const taskId = event.detail.row.Id;
        updateTaskStatus({ taskId })
            .then(() => {
                this.showToast('Success', 'Task status updated', 'success');
                return refreshApex(this.wiredTasks);
            })
            .catch(error => {
                this.showToast('Error', 'Error updating task status', 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
