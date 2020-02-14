import { Task } from "./types";
import events from "./events";

export class TaskRunner {
  private queue: Task<any>[] = [];

  private active: Task<any>[] = [];

  private done: Task<any>[] = [];

  constructor(private limit = 5, public debug = false) {
    if (limit < 1) throw new Error("limit must be interger greater then 1");
  }

  public addTask<T>(task: Task<T>) {
    this.queue.push(task);
    this.runTask();
  }

  private execute<T>(task: Task<T>) {
    this.log(`running ${task.id}`);
    return task.result
      .then(result => {
        this.log(`task ${task.id} finished`);
        events.emit("done", task.id);
        return result;
      })
      .catch(error => {
        this.log(`${task.id} failed`);
        events.emit("failed", task.id);
        throw error;
      })
      .finally(() => {
        const doneId = this.active.findIndex(i => i.id === task.id);
        const doneTask = this.active.splice(doneId, 1);
        this.done.push(...doneTask);
        this.runTask();
      });
  }

  private runTask() {
    while (this.active.length < this.limit && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.active.push(task);
        this.execute(task);
      }
    }
  }

  private log(msg: string) {
    if (this.debug) {
      console.info(`[TaskRunner] ${msg}`);
    }
  }
}
